import type { Address } from '@cfxdevkit/cdk/types';
import { normalizeAddress } from '@cfxdevkit/ui-core';
import { formatUnits, parseUnits } from 'viem';

export const EMPTY_ADDRESS = '0x0000000000000000000000000000000000000000' as Address;

export function sameAddress(left: Address | undefined, right: Address | undefined): boolean {
  return normalizeAddress(left ?? '') === normalizeAddress(right ?? '');
}

export function parseAmountInput(value: string, decimals: number): bigint {
  const trimmed = value.trim();
  if (!trimmed) return 0n;

  try {
    return parseUnits(trimmed, decimals);
  } catch {
    return 0n;
  }
}

export function formatAmount(value: bigint | undefined, decimals = 18): string {
  if (value === undefined) return '0.0000';
  return Number(formatUnits(value, decimals)).toFixed(4);
}
