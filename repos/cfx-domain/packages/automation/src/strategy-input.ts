import type { TriggerDirection } from './types.js';

export interface LimitOrderStrategy {
  kind: 'limit_order';
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  targetPrice: string;
  direction: TriggerDirection;
  slippageBps: number;
  expiresInDays: number | null;
}

export interface DCAStrategy {
  kind: 'dca';
  tokenIn: string;
  tokenOut: string;
  amountPerSwap: string;
  intervalHours: number;
  totalSwaps: number;
  slippageBps: number;
}

export interface TWAPStrategy {
  kind: 'twap';
  tokenIn: string;
  tokenOut: string;
  totalAmountIn: string;
  numberOfTranches: number;
  intervalHours: number;
  slippageBps: number;
  expiresInDays: number | null;
}

export interface SwapStrategy {
  kind: 'swap';
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  slippageBps: number;
}

export type Strategy = LimitOrderStrategy | DCAStrategy | TWAPStrategy | SwapStrategy;
