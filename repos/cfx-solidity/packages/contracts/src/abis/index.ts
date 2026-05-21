/**
 * `@cfxdevkit/contracts/abis` — back-compat re-exports.
 *
 * The standard ABI shapes now live in the leaf package `@cfxdevkit/abis` so
 * any layer of the stack (including `@cfxdevkit/cdk`) can consume them
 * without pulling contract-execution machinery. This module re-exports them
 * unchanged for back-compat.
 *
 * Prefer importing directly from the leaf package in new code:
 *
 * ```ts
 * import { ERC20_ABI } from '@cfxdevkit/abis';
 * ```
 */
export {
  ERC20_ABI,
  ERC721_ABI,
  ERC1155_ABI,
  MULTICALL3_ABI,
  MULTICALL3_ADDRESS,
} from '@cfxdevkit/abis';
