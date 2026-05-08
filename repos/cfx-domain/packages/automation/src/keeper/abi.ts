// biome-ignore-all format: on-chain ABI constants
import type { HexAddress } from '../types.js';

export const AUTOMATION_MANAGER_ADDRESSES = {
  testnet: '0x33e5E5B262e5d8eBC443E1c6c9F14215b020554d',
  mainnet: '0x9D5B131e5bA37A238cd1C485E2D9d7c2A68E1d0F',
} as const satisfies Record<string, HexAddress>;

export const AUTOMATION_MANAGER_ABI = [
  {
    type: 'function',
    name: 'executeLimitOrder',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'jobId', type: 'bytes32' },
      { name: 'router', type: 'address' },
      { name: 'swapCalldata', type: 'bytes' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'executeDCATick',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'jobId', type: 'bytes32' },
      { name: 'router', type: 'address' },
      { name: 'swapCalldata', type: 'bytes' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'getJob',
    stateMutability: 'view',
    inputs: [{ name: 'jobId', type: 'bytes32' }],
    outputs: [
      {
        name: 'job',
        type: 'tuple',
        components: [
          { name: 'id', type: 'bytes32' },
          { name: 'owner', type: 'address' },
          { name: 'jobType', type: 'uint8' },
          { name: 'status', type: 'uint8' },
          { name: 'createdAt', type: 'uint256' },
          { name: 'expiresAt', type: 'uint256' },
          { name: 'maxSlippageBps', type: 'uint256' },
        ],
      },
    ],
  },
  {
    type: 'function',
    name: 'getDCAJob',
    stateMutability: 'view',
    inputs: [{ name: 'jobId', type: 'bytes32' }],
    outputs: [
      {
        name: 'params',
        type: 'tuple',
        components: [
          { name: 'tokenIn', type: 'address' },
          { name: 'tokenOut', type: 'address' },
          { name: 'amountPerSwap', type: 'uint256' },
          { name: 'intervalSeconds', type: 'uint256' },
          { name: 'totalSwaps', type: 'uint256' },
          { name: 'swapsCompleted', type: 'uint256' },
          { name: 'nextExecution', type: 'uint256' },
        ],
      },
    ],
  },
  {
    type: 'function',
    name: 'paused',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'event',
    name: 'JobExecuted',
    inputs: [
      { name: 'jobId', type: 'bytes32', indexed: true },
      { name: 'owner', type: 'address', indexed: true },
      { name: 'amountOut', type: 'uint256', indexed: false },
    ],
  },
] as const;
