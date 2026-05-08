// biome-ignore-all format: ABI constants
import {
  erc1155Abi as viemErc1155Abi,
} from 'viem';

/** Full EIP-1155 interface (safeTransfer, balanceOfBatch, URI, events). */
export const ERC1155_ABI = viemErc1155Abi;
export const erc1155Abi = ERC1155_ABI;
export type ERC1155_ABI = typeof ERC1155_ABI;
