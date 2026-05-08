// biome-ignore-all format: legacy ABI constants
import { CONFLUX_PRECOMPILE_ADDRESSES } from './addresses.js';

/**
 * CrossSpaceCall — internal contract accessible from both Core Space and eSpace.
 * Enables synchronous cross-space calls: eSpace → Core Space and Core → eSpace.
 *
 * eSpace address: 0x0888000000000000000000000000000000000006
 * Access: Use `viem` client on eSpace, or `cive` client on Core Space.
 */
export const crossSpaceCallAbi = [
  // ─── Called from eSpace ────────────────────────────────────────────────────
  {
    type: 'function',
    name: 'callEVM',
    inputs: [
      { name: 'to', type: 'bytes20', internalType: 'bytes20' },
      { name: 'data', type: 'bytes', internalType: 'bytes' },
    ],
    outputs: [{ name: '', type: 'bytes', internalType: 'bytes' }],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'staticCallEVM',
    inputs: [
      { name: 'to', type: 'bytes20', internalType: 'bytes20' },
      { name: 'data', type: 'bytes', internalType: 'bytes' },
    ],
    outputs: [{ name: '', type: 'bytes', internalType: 'bytes' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'withdrawFromMapped',
    inputs: [{ name: 'value', type: 'uint256', internalType: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'mappedBalance',
    inputs: [{ name: 'addr', type: 'address', internalType: 'address' }],
    outputs: [{ name: '', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'transferEVM',
    inputs: [{ name: 'to', type: 'bytes20', internalType: 'bytes20' }],
    outputs: [{ name: '', type: 'bytes', internalType: 'bytes' }],
    stateMutability: 'payable',
  },
  // ─── Events ────────────────────────────────────────────────────────────────
  {
    type: 'event',
    name: 'Call',
    inputs: [
      { indexed: true, name: 'sender', type: 'bytes20' },
      { indexed: true, name: 'receiver', type: 'bytes20' },
      { indexed: false, name: 'value', type: 'uint256' },
      { indexed: false, name: 'nonce', type: 'uint256' },
      { indexed: false, name: 'data', type: 'bytes' },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'Outcome',
    inputs: [
      { indexed: false, name: 'success', type: 'bool' },
      { indexed: false, name: 'data', type: 'bytes' },
    ],
    anonymous: false,
  },
] as const;

export const CROSS_SPACE_CALL_ABI = crossSpaceCallAbi;
export const crossSpaceCallAddress = CONFLUX_PRECOMPILE_ADDRESSES.CrossSpaceCall;
