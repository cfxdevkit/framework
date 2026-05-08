// biome-ignore-all format: ABI constants
import { erc20Abi as viemErc20Abi } from 'viem';
import { ERC165_ABI } from './erc165.js';

/** EIP-2612 permit interface for signature-based ERC-20 approvals. */
export const ERC2612_ABI = [
  {
    type: 'function',
    name: 'permit',
    inputs: [
      { name: 'owner', type: 'address', internalType: 'address' },
      { name: 'spender', type: 'address', internalType: 'address' },
      { name: 'value', type: 'uint256', internalType: 'uint256' },
      { name: 'deadline', type: 'uint256', internalType: 'uint256' },
      { name: 'v', type: 'uint8', internalType: 'uint8' },
      { name: 'r', type: 'bytes32', internalType: 'bytes32' },
      { name: 's', type: 'bytes32', internalType: 'bytes32' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'nonces',
    inputs: [{ name: 'owner', type: 'address', internalType: 'address' }],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'DOMAIN_SEPARATOR',
    inputs: [],
    outputs: [{ name: '', type: 'bytes32', internalType: 'bytes32' }],
    stateMutability: 'view',
  },
] as const;
export const erc2612Abi = ERC2612_ABI;
export type ERC2612_ABI = typeof ERC2612_ABI;

/** Minimal EIP-20 interface (transfer, approve, allowance, events). */
export const ERC20_ABI = viemErc20Abi;
export const erc20Abi = ERC20_ABI;
export type ERC20_ABI = typeof ERC20_ABI;

/** ERC-20 plus common OpenZeppelin 5.x extensions used by DevKit templates. */
export const ERC20_EXTENDED_ABI = [
  ...ERC20_ABI,
  {
    type: 'function',
    name: 'cap',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'burn',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'burnFrom',
    inputs: [
      { name: 'account', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
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
  ...ERC2612_ABI,
  {
    type: 'function',
    name: 'mint',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
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
    name: 'getRoleAdmin',
    inputs: [{ name: 'role', type: 'bytes32' }],
    outputs: [{ name: '', type: 'bytes32' }],
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
    name: 'renounceRole',
    inputs: [
      { name: 'role', type: 'bytes32' },
      { name: 'callerConfirmation', type: 'address' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  ...ERC165_ABI,
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
    name: 'RoleRevoked',
    anonymous: false,
    inputs: [
      { indexed: true, name: 'role', type: 'bytes32' },
      { indexed: true, name: 'account', type: 'address' },
      { indexed: true, name: 'sender', type: 'address' },
    ],
  },
  {
    type: 'event',
    name: 'RoleAdminChanged',
    anonymous: false,
    inputs: [
      { indexed: true, name: 'role', type: 'bytes32' },
      { indexed: true, name: 'previousAdminRole', type: 'bytes32' },
      { indexed: true, name: 'newAdminRole', type: 'bytes32' },
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
export const erc20ExtendedAbi = ERC20_EXTENDED_ABI;
export type ERC20_EXTENDED_ABI = typeof ERC20_EXTENDED_ABI;
