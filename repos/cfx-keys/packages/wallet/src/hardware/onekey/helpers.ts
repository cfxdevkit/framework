import type { Hex, TypedData, TypedDataDomain } from 'viem';
import { hashDomain, hashStruct } from 'viem';
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

type NormalisedTypedData = {
  domain: TypedDataDomain;
  types: Record<string, { name: string; type: string }[]>;
  primaryType: string;
  message: Record<string, unknown>;
};

function inferDomainType(value: unknown): 'string' | 'uint256' | 'address' | 'bytes32' {
  if (typeof value === 'number' || typeof value === 'bigint') return 'uint256';
  if (typeof value === 'string') {
    if (/^0x[0-9a-fA-F]{40}$/.test(value)) return 'address';
    if (/^0x[0-9a-fA-F]{64}$/.test(value)) return 'bytes32';
  }
  return 'string';
}

/**
 * Ensure typed-data has a valid EIP712Domain type map. Some SDK paths crash
 * when `types.EIP712Domain` is absent even if `domain` is present.
 */
export function normaliseTypedData(typedData: unknown): NormalisedTypedData {
  const td = typedData as unknown as {
    domain?: TypedDataDomain;
    types?: Record<string, { name: string; type: string }[]>;
    primaryType?: string;
    message?: Record<string, unknown>;
  };

  if (!td.types || typeof td.types !== 'object') {
    throw new HardwareWalletError({
      code: 'wallet/hardware/onekey/bad-response',
      message: 'typedData.types is required',
    });
  }
  if (!td.primaryType || typeof td.primaryType !== 'string') {
    throw new HardwareWalletError({
      code: 'wallet/hardware/onekey/bad-response',
      message: 'typedData.primaryType is required',
    });
  }
  if (!td.message || typeof td.message !== 'object') {
    throw new HardwareWalletError({
      code: 'wallet/hardware/onekey/bad-response',
      message: 'typedData.message is required',
    });
  }

  const existingEip712Domain = td.types.EIP712Domain;
  const existingCip23Domain = td.types.CIP23Domain;
  if (
    existingEip712Domain &&
    Array.isArray(existingEip712Domain) &&
    existingEip712Domain.length > 0 &&
    existingCip23Domain &&
    Array.isArray(existingCip23Domain)
  ) {
    return {
      domain: td.domain ?? {},
      types: td.types,
      primaryType: td.primaryType,
      message: td.message,
    };
  }

  const domain = (td.domain ?? {}) as Record<string, unknown>;
  const domainType: { name: string; type: string }[] = (
    existingEip712Domain && Array.isArray(existingEip712Domain) && existingEip712Domain.length > 0
      ? existingEip712Domain
      : Object.entries(domain).map(([name, value]) => ({ name, type: inferDomainType(value) }))
  ) as {
    name: string;
    type: string;
  }[];

  return {
    domain: td.domain ?? {},
    types: {
      ...td.types,
      EIP712Domain: domainType,
      CIP23Domain:
        existingCip23Domain && Array.isArray(existingCip23Domain)
          ? existingCip23Domain
          : domainType,
    },
    primaryType: td.primaryType,
    message: td.message,
  };
}

/**
 * Compute the CIP-23 component hashes from a typed-data object.
 * CIP-23 is structurally identical to EIP-712 — the device expects the two
 * component hashes (domain separator + message hash) rather than the combined digest.
 */
export function computeCip23Hashes(typedData: TypedData): {
  domainHash: string;
  messageHash: string;
} {
  const td = normaliseTypedData(typedData);

  const domainHash = (hashDomain as (p: { domain: unknown; types: unknown }) => Hex)({
    domain: td.domain,
    types: td.types,
  });
  const messageHash = (
    hashStruct as (p: { data: unknown; primaryType: unknown; types: unknown }) => Hex
  )({
    data: td.message,
    primaryType: td.primaryType,
    types: td.types,
  });

  return {
    domainHash: domainHash.startsWith('0x') ? domainHash.slice(2) : domainHash,
    messageHash: messageHash.startsWith('0x') ? messageHash.slice(2) : messageHash,
  };
}

/**
 * Serialise the `(v, r, s)` tuple from `confluxSignTransaction` into a
 * 65-byte `0x`-prefixed raw signature (same format as personal_sign).
 */
export function serialiseCoreSignature(r: string, s: string, v: string | number): Hex {
  const vNum = parseV(v);
  return rawSignatureToHex({
    r: toCanonicalHex(r) as Hex,
    s: toCanonicalHex(s) as Hex,
    v: vNum,
  });
}
