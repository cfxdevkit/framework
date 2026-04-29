/**
 * `@cfxdevkit/core/units` — token unit math, BigInt-only.
 *
 * No `Number` arithmetic. Float-to-BigInt conversions go through
 * {@link parseUnits} which validates input as a decimal string.
 */
export { formatUnits, parseUnits } from 'viem';

import { formatUnits, parseUnits } from 'viem';
import type { Wei } from '../types/index.js';

/** Format a wei-scale BigInt for a token, returning `"<amount> <symbol>"`. */
export function formatToken(value: Wei, token: { decimals: number; symbol: string }): string {
  return `${formatUnits(value, token.decimals)} ${token.symbol}`;
}

/** Format a CFX amount (18 decimals). */
export function formatCFX(value: Wei): string {
  return formatUnits(value, 18);
}

/** Parse a decimal CFX string into a wei-scale BigInt. */
export function parseCFX(value: string): Wei {
  return parseUnits(value, 18);
}

/**
 * `JSON.stringify` that serialises `bigint` values as decimal strings.
 * Drop-in replacement for the standard library when working with blockchain
 * payloads that contain `bigint` (balances, gas, block numbers).
 */
export function stringifyBigInt(value: unknown, space?: number): string {
  return JSON.stringify(value, (_key, v) => (typeof v === 'bigint' ? v.toString() : v), space);
}
