/**
 * `@cfxdevkit/abis` — standard EVM ABI shapes.
 *
 * Definitions are sourced from `viem` (which tracks the canonical
 * EIP-20 / 721 / 1155 / Multicall3 interfaces) and re-exported here under
 * framework-stable aliases. Zero cfxdevkit dependencies — safe to depend on
 * from any layer of the stack, including `@cfxdevkit/cdk`.
 *
 * ```ts
 * import { ERC20_ABI } from '@cfxdevkit/abis';
 * ```
 */
export * from './erc20.js';
export * from './erc165.js';
export * from './erc721.js';
export * from './erc1155.js';
export * from './erc4626.js';
export * from './multicall3.js';
