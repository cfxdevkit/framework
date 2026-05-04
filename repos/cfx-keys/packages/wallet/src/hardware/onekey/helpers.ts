import type { Hex } from 'viem';
import { HardwareWalletError } from '../../errors/index.js';
import { rawSignatureToHex, toCanonicalHex } from '../types.js';

export function oneKeyError(
  code: string,
  payload: { error: string; code?: string | number },
): HardwareWalletError {
  return new HardwareWalletError({
    code,
    message: payload.error || 'OneKey device error',
    ...(payload.code !== undefined ? { meta: { vendorCode: payload.code } } : {}),
  });
}

export function throwIfAborted(signal: AbortSignal | undefined): void {
  if (signal?.aborted) {
    throw new HardwareWalletError({ code: 'wallet/hardware/aborted', message: 'signing aborted' });
  }
}

export function toHex(n: bigint | number | string): string {
  if (typeof n === 'string') return n.startsWith('0x') ? n : `0x${BigInt(n).toString(16)}`;
  return `0x${BigInt(n).toString(16)}`;
}

export function toMessageHex(message: string | Uint8Array): string {
  if (typeof message === 'string') {
    let hex = '';
    for (let index = 0; index < message.length; index++)
      hex += message.charCodeAt(index).toString(16).padStart(2, '0');
    return `0x${hex}`;
  }
  let hex = '';
  for (let index = 0; index < message.length; index++) {
    // biome-ignore lint/style/noNonNullAssertion: bounded by length
    hex += message[index]!.toString(16).padStart(2, '0');
  }
  return `0x${hex}`;
}

export function parseV(v: string | number): number {
  if (typeof v === 'number') return v;
  const stripped = v.startsWith('0x') ? v.slice(2) : v;
  return Number.parseInt(stripped, 16);
}

export function normaliseSignature(sig: string): Hex {
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
      code: 'wallet/hardware/onekey/bad-response',
      message: `unexpected signature length ${canonical.length}`,
    });
  }
  return canonical;
}
