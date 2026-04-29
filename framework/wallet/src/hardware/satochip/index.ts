/**
 * `@cfxdevkit/wallet/hardware/satochip` — Satochip JavaCard adapter.
 *
 * Talks to the Python bridge service shipped alongside the firmware
 * (default `http://127.0.0.1:8397`, see Satochip Implementation Guide § 3.2):
 *
 * - `GET  /health`           → `{ status, card_connected }`
 * - `POST /init`             → unlock with PIN
 * - `GET  /address?keypath`  → `{ address, keypath }`
 * - `POST /sign-message`     → `{ signature }`
 * - `POST /sign-transaction` → `{ signature, txHash }`
 *
 * The bridge is responsible for ECDH-secured PC/SC communication with the
 * card; we treat it as a trusted local sidecar and never expose it on a
 * non-loopback interface.
 *
 * `signTransaction` here returns the **raw signed RLP-encoded transaction**
 * — we ask the bridge for an `(r,s,v)` tuple over the unsigned tx and then
 * re-serialise via viem so consumers can broadcast directly.
 */
import type { Account, SignableTx, Signer, SignOptions, TypedData } from '@cfxdevkit/core';
import {
  type Hex,
  hashTypedData,
  serializeTransaction,
  type TransactionSerializableEIP1559,
} from 'viem';
import { HardwareWalletError } from '../../errors/index.js';
import {
  EVM_DEFAULT_PATH,
  finaliseEip1559Tx,
  rawSignatureToHex,
  toCanonicalHex,
} from '../types.js';

export interface SatochipBridgeConfig {
  /** Base URL of the Satochip bridge. Default `http://127.0.0.1:8397`. */
  bridgeUrl?: string;
  /** PIN to unlock the card on first contact. Optional if already unlocked. */
  pin?: string;
  /** BIP-44 path. Default `m/44'/60'/0'/0/0`. */
  keypath?: string;
  /** Custom fetch (for tests / proxies). Defaults to `globalThis.fetch`. */
  fetch?: typeof fetch;
  /** Per-request abort signal (in addition to the per-call `SignOptions.signal`). */
  signal?: AbortSignal;
  /** Defends against silent device swap. */
  expectedAddress?: `0x${string}`;
}

export interface SignerFromSatochipInput extends SatochipBridgeConfig {}

type BridgeFetch = (path: string, init?: RequestInit) => Promise<Response>;

/** Build a `Signer` backed by a Satochip card via the local bridge. */
export async function signerFromSatochip(input: SignerFromSatochipInput = {}): Promise<Signer> {
  const {
    bridgeUrl = 'http://127.0.0.1:8397',
    pin,
    keypath = EVM_DEFAULT_PATH,
    fetch: customFetch,
    expectedAddress,
  } = input;

  const fetchFn: typeof fetch =
    customFetch ??
    (globalThis.fetch as typeof fetch | undefined) ??
    ((() => {
      throw new HardwareWalletError({
        code: 'wallet/hardware/satochip/bridge-unreachable',
        message: 'no fetch implementation available; pass `fetch`',
      });
    }) as unknown as typeof fetch);

  const call: BridgeFetch = (path, init) =>
    fetchFn(`${bridgeUrl}${path}`, {
      ...init,
      headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
    });

  // Health probe.
  let health: { status: string; card_connected: boolean };
  try {
    const r = await call('/health');
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    health = (await r.json()) as { status: string; card_connected: boolean };
  } catch (cause) {
    throw new HardwareWalletError({
      code: 'wallet/hardware/satochip/bridge-unreachable',
      message: cause instanceof Error ? cause.message : 'bridge unreachable',
      cause,
    });
  }
  if (!health.card_connected) {
    throw new HardwareWalletError({
      code: 'wallet/hardware/satochip/no-card',
      message: 'Satochip bridge reports no card connected',
    });
  }

  if (pin !== undefined) {
    const r = await call('/init', { method: 'POST', body: JSON.stringify({ pin }) });
    if (!r.ok) {
      const detail = await safeDetail(r);
      throw new HardwareWalletError({
        code: 'wallet/hardware/satochip/bad-pin',
        message: detail || 'PIN verification failed',
      });
    }
  }

  // Address.
  const addrRes = await call(`/address?keypath=${encodeURIComponent(keypath)}`);
  if (!addrRes.ok) {
    throw new HardwareWalletError({
      code: 'wallet/hardware/satochip/bad-response',
      message: (await safeDetail(addrRes)) || 'failed to fetch address',
    });
  }
  const { address: rawAddr } = (await addrRes.json()) as { address: string };
  const address = toCanonicalHex(rawAddr) as `0x${string}`;
  if (expectedAddress && address.toLowerCase() !== expectedAddress.toLowerCase()) {
    throw new HardwareWalletError({
      code: 'wallet/hardware/address-mismatch',
      message: 'Satochip returned an address that does not match expectedAddress',
      meta: { expected: expectedAddress, actual: address },
    });
  }

  const account: Account = { address, publicKey: '0x' as Hex };

  return {
    account,

    async signTransaction(tx: SignableTx, opts?: SignOptions): Promise<Hex> {
      throwIfAborted(opts?.signal);
      if (tx.maxFeePerGas === undefined || tx.maxPriorityFeePerGas === undefined) {
        throw new HardwareWalletError({
          code: 'wallet/hardware/unsupported-tx-type',
          message: 'Satochip adapter currently only signs EIP-1559 transactions',
        });
      }
      const eip1559: TransactionSerializableEIP1559 = {
        type: 'eip1559',
        chainId: Number(tx.chainId),
        ...(tx.to !== undefined ? { to: tx.to } : {}),
        ...(tx.value !== undefined ? { value: tx.value } : {}),
        ...(tx.data !== undefined ? { data: tx.data } : {}),
        ...(tx.nonce !== undefined ? { nonce: tx.nonce } : {}),
        ...(tx.gas !== undefined ? { gas: tx.gas } : {}),
        maxFeePerGas: tx.maxFeePerGas,
        maxPriorityFeePerGas: tx.maxPriorityFeePerGas,
      };

      // Serialise the unsigned tx and ask the bridge to sign its keccak256 hash.
      const unsigned = serializeTransaction(eip1559);
      const r = await call('/sign-transaction', {
        method: 'POST',
        body: JSON.stringify({
          to: tx.to ?? '0x',
          value: hexBig(tx.value ?? 0n),
          data: tx.data ?? '0x',
          gas: hexBig(tx.gas ?? 21_000n),
          maxFeePerGas: hexBig(tx.maxFeePerGas),
          maxPriorityFeePerGas: hexBig(tx.maxPriorityFeePerGas),
          nonce: hexBig(BigInt(tx.nonce ?? 0)),
          chainId: Number(tx.chainId),
          keypath,
          unsignedRaw: unsigned,
        }),
        ...(opts?.signal ? { signal: opts.signal } : {}),
      });
      if (!r.ok) {
        throw new HardwareWalletError({
          code: 'wallet/hardware/satochip/bad-response',
          message: (await safeDetail(r)) || 'sign-transaction failed',
        });
      }
      const sig = (await r.json()) as { signature: string };
      const { r: rr, s: ss, v } = splitSignature(sig.signature);
      return finaliseEip1559Tx(eip1559, { r: rr, s: ss, v });
    },

    async signMessage(message: string | Uint8Array, opts?: SignOptions): Promise<Hex> {
      throwIfAborted(opts?.signal);
      const text = typeof message === 'string' ? message : new TextDecoder().decode(message);
      const r = await call('/sign-message', {
        method: 'POST',
        body: JSON.stringify({ message: text, keypath }),
        ...(opts?.signal ? { signal: opts.signal } : {}),
      });
      if (!r.ok) {
        throw new HardwareWalletError({
          code: 'wallet/hardware/satochip/bad-response',
          message: (await safeDetail(r)) || 'sign-message failed',
        });
      }
      const { signature } = (await r.json()) as { signature: string };
      return normaliseSignature(signature);
    },

    async signTypedData(typedData: TypedData, opts?: SignOptions): Promise<Hex> {
      throwIfAborted(opts?.signal);
      // The reference bridge has no native EIP-712 endpoint; we hash locally
      // and ask the bridge to sign the precomputed digest as a message.
      const digest = hashTypedData(typedData as never);
      const r = await call('/sign-message', {
        method: 'POST',
        body: JSON.stringify({ message: digest, keypath }),
        ...(opts?.signal ? { signal: opts.signal } : {}),
      });
      if (!r.ok) {
        throw new HardwareWalletError({
          code: 'wallet/hardware/satochip/bad-response',
          message: (await safeDetail(r)) || 'sign-typed-data failed',
        });
      }
      const { signature } = (await r.json()) as { signature: string };
      return normaliseSignature(signature);
    },
  };
}

// ── helpers ──────────────────────────────────────────────────────────────────

function throwIfAborted(signal: AbortSignal | undefined): void {
  if (signal?.aborted) {
    throw new HardwareWalletError({
      code: 'wallet/hardware/aborted',
      message: 'signing aborted',
    });
  }
}

function hexBig(n: bigint | number | string): string {
  if (typeof n === 'string') return n.startsWith('0x') ? n : `0x${BigInt(n).toString(16)}`;
  return `0x${BigInt(n).toString(16)}`;
}

function splitSignature(sig: string): { r: Hex; s: Hex; v: number } {
  const canonical = toCanonicalHex(sig);
  if (canonical.length !== 2 + 130) {
    throw new HardwareWalletError({
      code: 'wallet/hardware/satochip/bad-response',
      message: `expected 65-byte signature, got ${(canonical.length - 2) / 2} bytes`,
    });
  }
  return {
    r: `0x${canonical.slice(2, 66)}` as Hex,
    s: `0x${canonical.slice(66, 130)}` as Hex,
    v: Number.parseInt(canonical.slice(130, 132), 16),
  };
}

function normaliseSignature(sig: string): Hex {
  const canonical = toCanonicalHex(sig);
  if (canonical.length === 2 + 128) {
    return rawSignatureToHex({
      r: `0x${canonical.slice(2, 66)}` as Hex,
      s: `0x${canonical.slice(66, 130)}` as Hex,
      v: 27,
    });
  }
  if (canonical.length !== 2 + 130) {
    throw new HardwareWalletError({
      code: 'wallet/hardware/satochip/bad-response',
      message: `unexpected signature length ${canonical.length}`,
    });
  }
  return canonical;
}

async function safeDetail(r: Response): Promise<string> {
  try {
    const j = (await r.json()) as { detail?: string };
    return j.detail ?? '';
  } catch {
    return '';
  }
}
