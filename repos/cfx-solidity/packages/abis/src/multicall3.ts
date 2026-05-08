// biome-ignore-all format: ABI constants
import {
  multicall3Abi as viemMulticall3Abi,
} from 'viem';

/**
 * Multicall3 ABI. Canonical deployment lives at
 * `0xcA11bde05977b3631167028862bE2a173976CA11` on most EVM-compatible chains.
 */
export const MULTICALL3_ABI = viemMulticall3Abi;
export const multicall3Abi = MULTICALL3_ABI;
export type MULTICALL3_ABI = typeof MULTICALL3_ABI;

/**
 * Canonical Multicall3 deployment address. Verify it is deployed on the
 * target chain before calling — Conflux eSpace requires a chain-specific
 * verification step.
 */
export const MULTICALL3_ADDRESS = '0xcA11bde05977b3631167028862bE2a173976CA11' as const;
