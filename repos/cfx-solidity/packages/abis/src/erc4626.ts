// biome-ignore-all format: ABI constants
import {
  erc4626Abi as viemErc4626Abi,
} from 'viem';

/** ERC-4626 tokenized vault interface. */
export const ERC4626_ABI = viemErc4626Abi;
export const erc4626Abi = ERC4626_ABI;
export type ERC4626_ABI = typeof ERC4626_ABI;
