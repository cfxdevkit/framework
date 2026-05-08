// biome-ignore-all format: legacy ABI constants
import { CONFLUX_PRECOMPILE_ADDRESSES } from './addresses.js';

/**
 * SponsorWhitelist — Core Space internal contract.
 * Manages gas and collateral sponsorship, enabling gasless dApp UX.
 *
 * Address: 0x0888000000000000000000000000000000000001
 * Access: Core Space only (use `cive` client).
 */
export const sponsorWhitelistAbi = [
  {
    type: 'function',
    name: 'getSponsorForGas',
    inputs: [
      { name: 'contractAddr', type: 'address', internalType: 'address' },
    ],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getSponsoredBalanceForGas',
    inputs: [
      { name: 'contractAddr', type: 'address', internalType: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getSponsoredGasFeeUpperBound',
    inputs: [
      { name: 'contractAddr', type: 'address', internalType: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getSponsorForCollateral',
    inputs: [
      { name: 'contractAddr', type: 'address', internalType: 'address' },
    ],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getSponsoredBalanceForCollateral',
    inputs: [
      { name: 'contractAddr', type: 'address', internalType: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'isWhitelisted',
    inputs: [
      { name: 'contractAddr', type: 'address', internalType: 'address' },
      { name: 'userAddr', type: 'address', internalType: 'address' },
    ],
    outputs: [{ name: '', type: 'bool', internalType: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'isAllWhitelisted',
    inputs: [
      { name: 'contractAddr', type: 'address', internalType: 'address' },
    ],
    outputs: [{ name: '', type: 'bool', internalType: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'addPrivilegeByAdmin',
    inputs: [
      { name: 'contractAddr', type: 'address', internalType: 'address' },
      { name: 'addresses', type: 'address[]', internalType: 'address[]' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'removePrivilegeByAdmin',
    inputs: [
      { name: 'contractAddr', type: 'address', internalType: 'address' },
      { name: 'addresses', type: 'address[]', internalType: 'address[]' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'setSponsorForGas',
    inputs: [
      { name: 'contractAddr', type: 'address', internalType: 'address' },
      { name: 'upperBound', type: 'uint256', internalType: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'setSponsorForCollateral',
    inputs: [
      { name: 'contractAddr', type: 'address', internalType: 'address' },
    ],
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'addPrivilege',
    inputs: [
      { name: 'addresses', type: 'address[]', internalType: 'address[]' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'removePrivilege',
    inputs: [
      { name: 'addresses', type: 'address[]', internalType: 'address[]' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    name: 'SponsorUpdated',
    inputs: [
      { indexed: true, name: 'contractAddr', type: 'address' },
      { indexed: false, name: 'sponsorType', type: 'uint32' },
      { indexed: false, name: 'sponsor', type: 'address' },
      { indexed: false, name: 'value', type: 'uint256' },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'WhitelistUpdated',
    inputs: [
      { indexed: true, name: 'contractAddr', type: 'address' },
      { indexed: true, name: 'userAddr', type: 'address' },
      { indexed: false, name: 'isAdded', type: 'bool' },
    ],
    anonymous: false,
  },
] as const;

export const SPONSOR_WHITELIST_ABI = sponsorWhitelistAbi;
export const sponsorWhitelistAddress = CONFLUX_PRECOMPILE_ADDRESSES.SponsorWhitelist;
