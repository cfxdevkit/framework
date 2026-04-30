/**
 * `@cfxdevkit/wallet/hardware/onekey` — OneKey hardware-wallet adapter.
 *
 * The `@onekeyfe/hd-common-sdk` package (and its `hd-web-sdk` /
 * `hd-ble-sdk` siblings) is **injected** rather than imported so this
 * package does not pull a heavy peer that the consumer may already have
 * configured for their own runtime (Node, web, React Native, …).
 *
 * Typical wiring:
 *
 * ```ts
 * import HardwareSDK from '@onekeyfe/hd-common-sdk';
 * await HardwareSDK.init({ debug: false });
 * const signer = await signerFromOneKey({
 *   sdk: HardwareSDK,
 *   connectId: 'XXXX',
 *   deviceId: 'XXXX',
 *   chainId: 1030,
 * });
 * ```
 *
 * Conforms to the OneKey EVM API surface (see
 * https://developer.onekey.so → chain-evm): `evmGetAddress`,
 * `evmSignMessage`, `evmSignTransaction`, `evmSignTypedData`.
 */
import type { Account, SignableTx, Signer, SignOptions, TypedData } from '@cfxdevkit/core';
import type { Hex, TransactionSerializableEIP1559 } from 'viem';
import { HardwareWalletError } from '../../errors/index.js';
import {
  EVM_DEFAULT_PATH,
  finaliseEip1559Tx,
  rawSignatureToHex,
  toCanonicalHex,
} from '../types.js';

/** Subset of the OneKey SDK we depend on. */
export interface OneKeySdkLike {
  evmGetAddress(
    connectId: string,
    deviceId: string,
    params: { path: string; showOnOneKey?: boolean; chainId?: number },
  ): Promise<OneKeyResponse<{ address: string; path: string; publicKey?: string }>>;

  evmSignMessage(
    connectId: string,
    deviceId: string,
    params: { path: string; messageHex: string; chainId?: number },
  ): Promise<OneKeyResponse<{ signature: string; address?: string }>>;

  evmSignTransaction(
    connectId: string,
    deviceId: string,
    params: { path: string; transaction: OneKeyTxParams },
  ): Promise<OneKeyResponse<{ v: string; r: string; s: string }>>;

  evmSignTypedData(
    connectId: string,
    deviceId: string,
    params: {
      path: string;
      data: unknown;
      metamaskV4Compat?: boolean;
      chainId?: number;
    },
  ): Promise<OneKeyResponse<{ signature: string; address?: string }>>;
}

/** OneKey responses are tagged unions: success → payload, failure → error. */
export type OneKeyResponse<T> =
  | { success: true; payload: T }
  | { success: false; payload: { error: string; code?: string | number } };

/** Tx fields OneKey expects (all numbers as 0x-hex strings). */
export interface OneKeyTxParams {
  to: string;
  value: string;
  data?: string;
  chainId: number;
  nonce: string;
  gasLimit: string;
  // Legacy
  gasPrice?: string;
  // EIP-1559
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
}

export interface SignerFromOneKeyInput {
  /** Initialised OneKey SDK instance. */
  sdk: OneKeySdkLike;
  /** Device connect identifier (returned by `searchDevices`). */
  connectId: string;
  /** Device unique identifier. */
  deviceId: string;
  /** BIP-44 path. Defaults to `m/44'/60'/0'/0/0`. */
  path?: string;
  /** Default chain id for typed-data and personal_sign. */
  chainId?: number;
  /** If set, refuse to construct the signer when the device returns a
   *  different address than expected (defends against device-swap). */
  expectedAddress?: `0x${string}`;
  /** Show address on device during initial fetch. Default `false`. */
  showOnDevice?: boolean;
}

/** Build a `Signer` backed by a OneKey hardware device. */
export async function signerFromOneKey(input: SignerFromOneKeyInput): Promise<Signer> {
  const {
    sdk,
    connectId,
    deviceId,
    path = EVM_DEFAULT_PATH,
    chainId,
    expectedAddress,
    showOnDevice = false,
  } = input;

  const addrRes = await sdk.evmGetAddress(connectId, deviceId, {
    path,
    showOnOneKey: showOnDevice,
    ...(chainId !== undefined ? { chainId } : {}),
  });
  if (!addrRes.success) {
    throw oneKeyError('wallet/hardware/onekey/device-error', addrRes.payload);
  }
  const address = toCanonicalHex(addrRes.payload.address) as `0x${string}`;
  const publicKey = (
    addrRes.payload.publicKey ? toCanonicalHex(addrRes.payload.publicKey) : ('0x' as Hex)
  ) as `0x${string}`;
  if (expectedAddress && address.toLowerCase() !== expectedAddress.toLowerCase()) {
    throw new HardwareWalletError({
      code: 'wallet/hardware/address-mismatch',
      message: 'OneKey returned an address that does not match expectedAddress',
      meta: { expected: expectedAddress, actual: address },
    });
  }

  const account: Account = { address, publicKey };

  return {
    account,

    async signTransaction(tx: SignableTx, opts?: SignOptions): Promise<Hex> {
      throwIfAborted(opts?.signal);
      if (tx.maxFeePerGas === undefined || tx.maxPriorityFeePerGas === undefined) {
        throw new HardwareWalletError({
          code: 'wallet/hardware/unsupported-tx-type',
          message: 'OneKey adapter currently only signs EIP-1559 transactions',
        });
      }
      const eip1559: TransactionSerializableEIP1559 = {
        type: 'eip1559',
        chainId: Number(tx.chainId),
        ...(tx.to !== undefined ? { to: tx.to as `0x${string}` } : {}),
        ...(tx.value !== undefined ? { value: tx.value } : {}),
        ...(tx.data !== undefined ? { data: tx.data } : {}),
        ...(tx.nonce !== undefined ? { nonce: tx.nonce } : {}),
        ...(tx.gas !== undefined ? { gas: tx.gas } : {}),
        maxFeePerGas: tx.maxFeePerGas,
        maxPriorityFeePerGas: tx.maxPriorityFeePerGas,
      };

      const params: OneKeyTxParams = {
        to: tx.to ?? '0x',
        value: toHex(tx.value ?? 0n),
        ...(tx.data !== undefined ? { data: tx.data } : {}),
        chainId: Number(tx.chainId),
        nonce: toHex(BigInt(tx.nonce ?? 0)),
        gasLimit: toHex(tx.gas ?? 21_000n),
        maxFeePerGas: toHex(tx.maxFeePerGas),
        maxPriorityFeePerGas: toHex(tx.maxPriorityFeePerGas),
      };
      const res = await sdk.evmSignTransaction(connectId, deviceId, {
        path,
        transaction: params,
      });
      if (!res.success) throw oneKeyError('wallet/hardware/onekey/device-error', res.payload);

      return finaliseEip1559Tx(eip1559, {
        r: toCanonicalHex(res.payload.r),
        s: toCanonicalHex(res.payload.s),
        v: parseV(res.payload.v),
      });
    },

    async signMessage(message: string | Uint8Array, opts?: SignOptions): Promise<Hex> {
      throwIfAborted(opts?.signal);
      const messageHex = toMessageHex(message);
      const res = await sdk.evmSignMessage(connectId, deviceId, {
        path,
        messageHex,
        ...(chainId !== undefined ? { chainId } : {}),
      });
      if (!res.success) throw oneKeyError('wallet/hardware/onekey/device-error', res.payload);
      return normaliseSignature(res.payload.signature);
    },

    async signTypedData(typedData: TypedData, opts?: SignOptions): Promise<Hex> {
      throwIfAborted(opts?.signal);
      const res = await sdk.evmSignTypedData(connectId, deviceId, {
        path,
        data: typedData,
        metamaskV4Compat: true,
        ...(chainId !== undefined ? { chainId } : {}),
      });
      if (!res.success) throw oneKeyError('wallet/hardware/onekey/device-error', res.payload);
      return normaliseSignature(res.payload.signature);
    },
  };
}

// ── helpers ──────────────────────────────────────────────────────────────────

function oneKeyError(
  code: string,
  payload: { error: string; code?: string | number },
): HardwareWalletError {
  return new HardwareWalletError({
    code,
    message: payload.error || 'OneKey device error',
    ...(payload.code !== undefined ? { meta: { vendorCode: payload.code } } : {}),
  });
}

function throwIfAborted(signal: AbortSignal | undefined): void {
  if (signal?.aborted) {
    throw new HardwareWalletError({
      code: 'wallet/hardware/aborted',
      message: 'signing aborted',
    });
  }
}

function toHex(n: bigint | number | string): string {
  if (typeof n === 'string') {
    return n.startsWith('0x') ? n : `0x${BigInt(n).toString(16)}`;
  }
  return `0x${BigInt(n).toString(16)}`;
}

function toMessageHex(message: string | Uint8Array): string {
  if (typeof message === 'string') {
    let hex = '';
    for (let i = 0; i < message.length; i++) {
      hex += message.charCodeAt(i).toString(16).padStart(2, '0');
    }
    return `0x${hex}`;
  }
  let hex = '';
  for (let i = 0; i < message.length; i++) {
    // biome-ignore lint/style/noNonNullAssertion: bounded by length
    hex += message[i]!.toString(16).padStart(2, '0');
  }
  return `0x${hex}`;
}

function parseV(v: string | number): number {
  if (typeof v === 'number') return v;
  const stripped = v.startsWith('0x') ? v.slice(2) : v;
  return Number.parseInt(stripped, 16);
}

function normaliseSignature(sig: string): Hex {
  const canonical = toCanonicalHex(sig);
  // Some firmware returns 64-byte (r||s) — synthesise v=27 for compatibility.
  if (canonical.length === 2 + 128) {
    return rawSignatureToHex({
      r: `0x${canonical.slice(2, 66)}` as Hex,
      s: `0x${canonical.slice(66, 130)}` as Hex,
      v: 27,
    });
  }
  if (canonical.length !== 2 + 130) {
    throw new HardwareWalletError({
      code: 'wallet/hardware/onekey/bad-response',
      message: `unexpected signature length ${canonical.length}`,
    });
  }
  return canonical;
}
