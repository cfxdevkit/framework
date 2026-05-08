/**
 * `@cfxdevkit/core/units` — token unit math, BigInt-only.
 *
 * No `Number` arithmetic. Float-to-BigInt conversions go through
 * {@link parseUnits} which validates input as a decimal string.
 *
 * Conflux uses **drip** (1 CFX = 10^18 drip) as the smallest unit and
 * **Gdrip** (1 Gdrip = 10^9 drip) as the conventional gas-price unit. The
 * helpers below are 1:1 wrappers over `viem`'s decimal math, named to match
 * Conflux conventions.
 */
export { formatUnits, parseUnits } from 'viem';

import { formatUnits, parseUnits } from 'viem';
import type { Address, Wei } from '../types/index.js';

/** Maximum unsigned 256-bit integer, commonly used for unlimited ERC-20 approvals. */
export const MAX_UINT256 = 2n ** 256n - 1n;

/** Maximum unsigned 128-bit integer. */
export const MAX_UINT128 = 2n ** 128n - 1n;

/** Zero EVM address. */
export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as Address;

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

/** Format a drip amount as CFX (alias of {@link formatCFX}; semantic clarity in Core code). */
export function formatDrip(value: Wei): string {
  return formatUnits(value, 18);
}

/** Parse a decimal CFX string into drip (alias of {@link parseCFX}). */
export function parseDrip(value: string): Wei {
  return parseUnits(value, 18);
}

/** Format a drip amount in Gdrip (gas-price unit; 1 Gdrip = 1e9 drip). */
export function formatGDrip(value: Wei): string {
  return formatUnits(value, 9);
}

/** Parse a decimal Gdrip string into drip. */
export function parseGDrip(value: string): Wei {
  return parseUnits(value, 9);
}

/**
 * `JSON.stringify` that serialises `bigint` values as decimal strings.
 * Drop-in replacement for the standard library when working with blockchain
 * payloads that contain `bigint` (balances, gas, block numbers).
 */
export function stringifyBigInt(value: unknown, space?: number): string {
  return JSON.stringify(value, (_key, v) => (typeof v === 'bigint' ? v.toString() : v), space);
}
