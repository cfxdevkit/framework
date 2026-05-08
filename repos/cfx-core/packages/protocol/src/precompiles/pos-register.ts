// biome-ignore-all format: legacy ABI constants
import { CONFLUX_PRECOMPILE_ADDRESSES } from './addresses.js';

/**
 * PoSRegister — Core Space internal contract.
 * Manages PoS validator registration and provides staking/reward queries.
 *
 * Address: 0x0888000000000000000000000000000000000005
 * Access: Core Space only (use `cive` client).
 */
export const posRegisterAbi = [
  {
    type: 'function',
    name: 'register',
    inputs: [
      { name: 'indentifier', type: 'bytes32', internalType: 'bytes32' },
      { name: 'votePower', type: 'uint64', internalType: 'uint64' },
      { name: 'blsPubKey', type: 'bytes', internalType: 'bytes' },
      { name: 'vrfPubKey', type: 'bytes', internalType: 'bytes' },
      { name: 'blsPubKeyProof', type: 'bytes[2]', internalType: 'bytes[2]' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'increaseStake',
    inputs: [{ name: 'votePower', type: 'uint64', internalType: 'uint64' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'retire',
    inputs: [{ name: 'votePower', type: 'uint64', internalType: 'uint64' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getVotes',
    inputs: [{ name: 'identifier', type: 'bytes32', internalType: 'bytes32' }],
    outputs: [
      { name: 'totalVotes', type: 'uint256', internalType: 'uint256' },
      { name: 'unlockedVotes', type: 'uint256', internalType: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'identifierToAddress',
    inputs: [{ name: 'identifier', type: 'bytes32', internalType: 'bytes32' }],
    outputs: [{ name: '', type: 'address', internalType: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'addressToIdentifier',
    inputs: [{ name: 'addr', type: 'address', internalType: 'address' }],
    outputs: [{ name: '', type: 'bytes32', internalType: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'Register',
    inputs: [
      { indexed: true, name: 'identifier', type: 'bytes32' },
      { indexed: false, name: 'blsPubKey', type: 'bytes' },
      { indexed: false, name: 'vrfPubKey', type: 'bytes' },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'IncreaseStake',
    inputs: [
      { indexed: true, name: 'identifier', type: 'bytes32' },
      { indexed: false, name: 'votePower', type: 'uint64' },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'Retire',
    inputs: [
      { indexed: true, name: 'identifier', type: 'bytes32' },
      { indexed: false, name: 'votePower', type: 'uint64' },
    ],
    anonymous: false,
  },
] as const;

export const POS_REGISTER_ABI = posRegisterAbi;
export const posRegisterAddress = CONFLUX_PRECOMPILE_ADDRESSES.PoSRegister;
