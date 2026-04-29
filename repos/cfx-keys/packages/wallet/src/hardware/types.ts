/**
 * Common types shared by hardware-wallet adapters (OneKey, Satochip, …).
 *
 * The framework `Signer` interface (`@cfxdevkit/core`) expects
 * `signTransaction` to return a fully-RLP-encoded **raw signed
 * transaction** as 0x-hex, ready to broadcast. Hardware devices typically
 * return an `(r, s, v)` tuple instead — this module provides the helpers
 * that turn such tuples into the canonical raw form via viem's
 * `serializeTransaction`.
 */
import type { Signer } from '@cfxdevkit/core';
import { type Hex, serializeTransaction, type TransactionSerializableEIP1559 } from 'viem';
import { HardwareWalletError } from '../errors/index.js';

/** Default Conflux eSpace / EVM derivation path. */
export const EVM_DEFAULT_PATH = "m/44'/60'/0'/0/0" as const;

/** Vendor identifier; used for telemetry & error categorisation. */
export type HardwareWalletKind = 'onekey' | 'satochip';

/** Vendor-agnostic adapter contract. */
export interface HardwareWalletAdapter {
  readonly kind: HardwareWalletKind;
  /** Build a `Signer` for the device key at `path`. */
  getSigner(path?: string): Promise<Signer>;
}

/**
 * Raw secp256k1 signature components as returned by most hardware wallets.
 * `r`/`s` are 0x-prefixed 32-byte hex strings; `v` is `27|28` for personal
 * messages and `0|1` for EIP-1559/typed-data signatures (we normalise on the
 * way out).
 */
export interface RawEvmSignature {
  r: Hex;
  s: Hex;
  v: number;
}

/** Serialise an `(r,s,v)` tuple to the 65-byte 0x-hex personal_sign form. */
export function rawSignatureToHex(sig: RawEvmSignature): Hex {
  const r = stripHex(sig.r).padStart(64, '0');
  const s = stripHex(sig.s).padStart(64, '0');
  if (r.length !== 64 || s.length !== 64) {
    throw new HardwareWalletError({
      code: 'wallet/hardware/bad-signature',
      message: 'r/s must be 32 bytes',
      meta: { rLen: r.length, sLen: s.length },
    });
  }
  // Normalise v to 27/28 for compatibility with `eth_personalSign` consumers.
  let v = sig.v;
  if (v === 0 || v === 1) v += 27;
  if (v !== 27 && v !== 28) {
    throw new HardwareWalletError({
      code: 'wallet/hardware/bad-signature',
      message: `v must be 0|1|27|28, got ${sig.v}`,
    });
  }
  return `0x${r}${s}${v.toString(16).padStart(2, '0')}` as Hex;
}

/** Coerce a possibly-unprefixed hex string to canonical 0x-prefixed form. */
export function toCanonicalHex(s: string): Hex {
  const stripped = stripHex(s);
  if (!/^[0-9a-fA-F]*$/.test(stripped)) {
    throw new HardwareWalletError({
      code: 'wallet/hardware/bad-response',
      message: 'expected hex string',
    });
  }
  return `0x${stripped.toLowerCase()}` as Hex;
}

/**
 * Combine an unsigned EIP-1559 transaction with an `(r,s,v)` tuple into the
 * canonical raw signed transaction. `v` may be either 0/1 (parity) or 27/28.
 */
export function finaliseEip1559Tx(tx: TransactionSerializableEIP1559, sig: RawEvmSignature): Hex {
  // viem accepts yParity 0|1 *or* legacy v in the signature object; normalise to 0|1.
  let yParity = sig.v;
  if (yParity === 27 || yParity === 28) yParity -= 27;
  if (yParity !== 0 && yParity !== 1) {
    throw new HardwareWalletError({
      code: 'wallet/hardware/bad-signature',
      message: `v parity must be 0|1|27|28, got ${sig.v}`,
    });
  }
  return serializeTransaction(tx, {
    r: toCanonicalHex(sig.r) as Hex,
    s: toCanonicalHex(sig.s) as Hex,
    yParity: yParity as 0 | 1,
  });
}

function stripHex(s: string): string {
  return s.startsWith('0x') || s.startsWith('0X') ? s.slice(2) : s;
}
