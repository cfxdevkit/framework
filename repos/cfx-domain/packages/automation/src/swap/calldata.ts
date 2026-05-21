import type { Hex } from '@cfxdevkit/cdk';
import { encodeFunctionData } from 'viem';
import type { HexAddress } from '../types.js';

export const SWAPPI_ROUTER_ABI = [
  {
    type: 'function',
    name: 'getAmountsOut',
    stateMutability: 'view',
    inputs: [
      { name: 'amountIn', type: 'uint256' },
      { name: 'path', type: 'address[]' },
    ],
    outputs: [{ name: 'amounts', type: 'uint256[]' }],
  },
  {
    type: 'function',
    name: 'swapExactTokensForTokens',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'amountIn', type: 'uint256' },
      { name: 'amountOutMin', type: 'uint256' },
      { name: 'path', type: 'address[]' },
      { name: 'to', type: 'address' },
      { name: 'deadline', type: 'uint256' },
    ],
    outputs: [{ name: 'amounts', type: 'uint256[]' }],
  },
] as const;

export interface BuildSwapCalldataInput {
  tokenIn: HexAddress;
  tokenOut: HexAddress;
  amountIn: bigint;
  recipient: HexAddress;
  deadline: bigint;
  amountOutMin?: bigint;
}

export function buildSwapCalldata(input: BuildSwapCalldataInput): Hex {
  return encodeFunctionData({
    abi: SWAPPI_ROUTER_ABI,
    functionName: 'swapExactTokensForTokens',
    args: [
      input.amountIn,
      input.amountOutMin ?? 0n,
      [input.tokenIn, input.tokenOut],
      input.recipient,
      input.deadline,
    ],
  });
}
