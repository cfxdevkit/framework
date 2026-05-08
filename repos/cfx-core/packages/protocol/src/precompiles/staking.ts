// biome-ignore-all format: legacy ABI constants
import { CONFLUX_PRECOMPILE_ADDRESSES } from './addresses.js';

/**
 * Staking — Core Space internal contract.
 * Manages PoS staking: deposit CFX, withdraw, and vote-lock for governance.
 *
 * Address: 0x0888000000000000000000000000000000000002
 * Access: Core Space only (use `cive` client).
 */
export const stakingAbi = [
  {
    type: 'function',
    name: 'getStakingBalance',
    inputs: [{ name: 'user', type: 'address', internalType: 'address' }],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getLockedStakingBalance',
    inputs: [
      { name: 'user', type: 'address', internalType: 'address' },
      { name: 'blockNumber', type: 'uint256', internalType: 'uint256' },
    ],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getVotePower',
    inputs: [
      { name: 'user', type: 'address', internalType: 'address' },
      { name: 'blockNumber', type: 'uint256', internalType: 'uint256' },
    ],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'deposit',
    inputs: [{ name: 'amount', type: 'uint256', internalType: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'withdraw',
    inputs: [{ name: 'amount', type: 'uint256', internalType: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'voteLock',
    inputs: [
      { name: 'amount', type: 'uint256', internalType: 'uint256' },
      { name: 'unlockBlock', type: 'uint256', internalType: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    name: 'Deposit',
    inputs: [
      { indexed: true, name: 'user', type: 'address' },
      { indexed: false, name: 'amount', type: 'uint256' },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'Withdraw',
    inputs: [
      { indexed: true, name: 'user', type: 'address' },
      { indexed: false, name: 'amount', type: 'uint256' },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'VoteLock',
    inputs: [
      { indexed: true, name: 'user', type: 'address' },
      { indexed: false, name: 'amount', type: 'uint256' },
      { indexed: false, name: 'unlockBlock', type: 'uint256' },
    ],
    anonymous: false,
  },
] as const;

export const STAKING_ABI = stakingAbi;
export const stakingAddress = CONFLUX_PRECOMPILE_ADDRESSES.Staking;
