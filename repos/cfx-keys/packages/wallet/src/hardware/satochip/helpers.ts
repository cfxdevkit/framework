/** @on-hold — See satochip/index.ts. Python bridge required; not suitable for browser showcase. */
import type { Hex } from 'viem';
import { HardwareWalletError } from '../../errors/index.js';
import { rawSignatureToHex, toCanonicalHex } from '../types.js';

export function throwIfAborted(signal: AbortSignal | undefined): void {
  if (signal?.aborted) {
    throw new HardwareWalletError({ code: 'wallet/hardware/aborted', message: 'signing aborted' });
  }
}

export function hexBig(n: bigint | number | string): string {
  if (typeof n === 'string') return n.startsWith('0x') ? n : `0x${BigInt(n).toString(16)}`;
  return `0x${BigInt(n).toString(16)}`;
}

export function splitSignature(sig: string): { r: Hex; s: Hex; v: number } {
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
      code: 'wallet/hardware/satochip/bad-response',
      message: `unexpected signature length ${canonical.length}`,
    });
  }
  return canonical;
}

export async function safeDetail(response: Response): Promise<string> {
  try {
    const json = (await response.json()) as { detail?: string };
    return json.detail ?? '';
  } catch {
    return '';
  }
}
