import type { CasHexAddress } from './jobs.js';

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const;
export const MAX_UINT256 =
  115792089237316195423570985008687907853269984665640564039457584007913129639935n;

export const ERC20_ABI = [
  {
    type: 'function',
    name: 'allowance',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'approve',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;

export const WCFX_ABI = [
  ...ERC20_ABI,
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'deposit',
    stateMutability: 'payable',
    inputs: [],
    outputs: [],
  },
  {
    type: 'function',
    name: 'withdraw',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [],
  },
] as const;

export const AUTOMATION_MANAGER_ABI = [
  {
    type: 'function',
    name: 'createLimitOrder',
    stateMutability: 'nonpayable',
    inputs: [
      {
        name: 'params',
        type: 'tuple',
        components: [
          { name: 'tokenIn', type: 'address' },
          { name: 'tokenOut', type: 'address' },
          { name: 'amountIn', type: 'uint256' },
          { name: 'minAmountOut', type: 'uint256' },
          { name: 'targetPrice', type: 'uint256' },
          { name: 'triggerAbove', type: 'bool' },
        ],
      },
      { name: 'slippageBps', type: 'uint16' },
      { name: 'expiresAt', type: 'uint64' },
    ],
    outputs: [{ name: 'jobId', type: 'bytes32' }],
  },
  {
    type: 'function',
    name: 'createDCAJob',
    stateMutability: 'nonpayable',
    inputs: [
      {
        name: 'params',
        type: 'tuple',
        components: [
          { name: 'tokenIn', type: 'address' },
          { name: 'tokenOut', type: 'address' },
          { name: 'amountPerSwap', type: 'uint256' },
          { name: 'intervalSeconds', type: 'uint64' },
          { name: 'totalSwaps', type: 'uint32' },
          { name: 'swapsCompleted', type: 'uint32' },
          { name: 'nextExecution', type: 'uint64' },
        ],
      },
      { name: 'slippageBps', type: 'uint16' },
      { name: 'expiresAt', type: 'uint64' },
    ],
    outputs: [{ name: 'jobId', type: 'bytes32' }],
  },
  {
    type: 'function',
    name: 'cancelJob',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'jobId', type: 'bytes32' }],
    outputs: [],
  },
  {
    type: 'event',
    name: 'JobCreated',
    inputs: [
      { name: 'jobId', type: 'bytes32', indexed: true },
      { name: 'owner', type: 'address', indexed: true },
      { name: 'jobType', type: 'uint8', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'JobCancelled',
    inputs: [
      { name: 'jobId', type: 'bytes32', indexed: true },
      { name: 'canceller', type: 'address', indexed: true },
    ],
  },
  { type: 'error', name: 'DCACompleted', inputs: [] },
  { type: 'error', name: 'DCAIntervalNotReached', inputs: [] },
  { type: 'error', name: 'EnforcedPause', inputs: [] },
  { type: 'error', name: 'InvalidParams', inputs: [] },
  { type: 'error', name: 'JobExpiredError', inputs: [] },
  { type: 'error', name: 'JobNotActive', inputs: [] },
  { type: 'error', name: 'JobNotFound', inputs: [] },
  { type: 'error', name: 'PriceConditionNotMet', inputs: [] },
  { type: 'error', name: 'SlippageTooHigh', inputs: [] },
  { type: 'error', name: 'TooManyJobs', inputs: [] },
  { type: 'error', name: 'Unauthorized', inputs: [] },
  { type: 'error', name: 'ZeroAddress', inputs: [] },
] as const;

export function readAutomationManagerAddress(value?: string): CasHexAddress {
  return value?.startsWith('0x') ? (value as CasHexAddress) : ZERO_ADDRESS;
}
