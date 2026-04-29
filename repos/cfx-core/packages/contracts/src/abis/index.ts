/**
 * `@cfxdevkit/contracts/abis` — standard token ABIs.
 *
 * The shape definitions are sourced from `viem` (which tracks the canonical
 * EIP-20 / 721 / 1155 / Multicall3 interfaces) and re-exported here under
 * framework-stable aliases. Sub-paths exist so consumers can import only the
 * surface they need:
 *
 * ```ts
 * import { ERC20_ABI } from '@cfxdevkit/contracts/abis';
 * ```
 */
import {
  erc20Abi as viemErc20Abi,
  erc721Abi as viemErc721Abi,
  erc1155Abi as viemErc1155Abi,
  multicall3Abi as viemMulticall3Abi,
} from 'viem';

/** Minimal EIP-20 interface (transfer, approve, allowance, events). */
export const ERC20_ABI = viemErc20Abi;
export type ERC20_ABI = typeof ERC20_ABI;

/** Minimal EIP-721 interface (safeTransfer, approve, tokenURI, events). */
export const ERC721_ABI = viemErc721Abi;
export type ERC721_ABI = typeof ERC721_ABI;

/** Full EIP-1155 interface (safeTransfer, balanceOfBatch, URI, events). */
export const ERC1155_ABI = viemErc1155Abi;
export type ERC1155_ABI = typeof ERC1155_ABI;

/**
 * Multicall3 ABI. Canonical deployment lives at
 * `0xcA11bde05977b3631167028862bE2a173976CA11` on most EVM-compatible chains.
 */
export const MULTICALL3_ABI = viemMulticall3Abi;
export type MULTICALL3_ABI = typeof MULTICALL3_ABI;

/**
 * Canonical Multicall3 deployment address. Verify it is deployed on the
 * target chain before calling — Conflux eSpace requires a chain-specific
 * verification step.
 */
export const MULTICALL3_ADDRESS = '0xcA11bde05977b3631167028862bE2a173976CA11' as const;
