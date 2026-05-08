// biome-ignore-all format: ABI constants
import { erc721Abi as viemErc721Abi } from 'viem';
import { ERC165_ABI } from './erc165.js';

/** Minimal EIP-721 interface (safeTransfer, approve, tokenURI, events). */
export const ERC721_ABI = viemErc721Abi;
export const erc721Abi = ERC721_ABI;
export type ERC721_ABI = typeof ERC721_ABI;

/** ERC-721 enumerable extension. */
export const ERC721_ENUMERABLE_ABI = [
  {
    type: 'function',
    name: 'totalSupply',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'tokenByIndex',
    inputs: [{ name: 'index', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'tokenOfOwnerByIndex',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'index', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
] as const;
export const erc721EnumerableAbi = ERC721_ENUMERABLE_ABI;
export type ERC721_ENUMERABLE_ABI = typeof ERC721_ENUMERABLE_ABI;

/** ERC-2981 royalty info extension for NFT marketplaces. */
export const ERC2981_ABI = [
  ...ERC165_ABI,
  {
    type: 'function',
    name: 'royaltyInfo',
    inputs: [
      { name: 'tokenId', type: 'uint256' },
      { name: 'salePrice', type: 'uint256' },
    ],
    outputs: [
      { name: 'receiver', type: 'address' },
      { name: 'royaltyAmount', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
] as const;
export const erc2981Abi = ERC2981_ABI;
export type ERC2981_ABI = typeof ERC2981_ABI;

/** ERC-721 plus common OpenZeppelin 5.x enumerable, burnable, pausable, royalty, and role extensions. */
export const ERC721_EXTENDED_ABI = [
  ...ERC721_ABI,
  ...ERC721_ENUMERABLE_ABI,
  {
    type: 'function',
    name: 'burn',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'paused',
    inputs: [],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  },
  { type: 'function', name: 'pause', inputs: [], outputs: [], stateMutability: 'nonpayable' },
  { type: 'function', name: 'unpause', inputs: [], outputs: [], stateMutability: 'nonpayable' },
  ...ERC2981_ABI,
  {
    type: 'function',
    name: 'safeMint',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'uri', type: 'string' },
    ],
    outputs: [{ name: 'tokenId', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'maxSupply',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'setDefaultRoyalty',
    inputs: [
      { name: 'receiver', type: 'address' },
      { name: 'feeNumerator', type: 'uint96' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'hasRole',
    inputs: [
      { name: 'role', type: 'bytes32' },
      { name: 'account', type: 'address' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'grantRole',
    inputs: [
      { name: 'role', type: 'bytes32' },
      { name: 'account', type: 'address' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'revokeRole',
    inputs: [
      { name: 'role', type: 'bytes32' },
      { name: 'account', type: 'address' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'MINTER_ROLE',
    inputs: [],
    outputs: [{ name: '', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'PAUSER_ROLE',
    inputs: [],
    outputs: [{ name: '', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'RoleGranted',
    anonymous: false,
    inputs: [
      { indexed: true, name: 'role', type: 'bytes32' },
      { indexed: true, name: 'account', type: 'address' },
      { indexed: true, name: 'sender', type: 'address' },
    ],
  },
  {
    type: 'event',
    name: 'Paused',
    anonymous: false,
    inputs: [{ indexed: false, name: 'account', type: 'address' }],
  },
  {
    type: 'event',
    name: 'Unpaused',
    anonymous: false,
    inputs: [{ indexed: false, name: 'account', type: 'address' }],
  },
] as const;
export const erc721ExtendedAbi = ERC721_EXTENDED_ABI;
export type ERC721_EXTENDED_ABI = typeof ERC721_EXTENDED_ABI;
