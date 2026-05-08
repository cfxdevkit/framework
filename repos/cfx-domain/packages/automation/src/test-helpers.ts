import type { DCAJob, LimitOrderJob } from './types.js';

export const OWNER = '0x0000000000000000000000000000000000000001' as const;
export const TOKEN_IN = '0x0000000000000000000000000000000000000002' as const;
export const TOKEN_OUT = '0x0000000000000000000000000000000000000003' as const;

export function limitOrderJob(overrides: Partial<LimitOrderJob> = {}): LimitOrderJob {
  return {
    id: 'limit-1',
    owner: OWNER,
    type: 'limit_order',
    status: 'active',
    params: {
      tokenIn: TOKEN_IN,
      tokenOut: TOKEN_OUT,
      amountIn: 100n * 10n ** 18n,
      minAmountOut: 90n * 10n ** 18n,
      targetPrice: 2n * 10n ** 18n,
      direction: 'gte',
      slippageBps: 100,
    },
    createdAt: 1_000,
    updatedAt: 1_000,
    retries: 0,
    maxRetries: 5,
    ...overrides,
  };
}

export function dcaJob(overrides: Partial<DCAJob> = {}): DCAJob {
  return {
    id: 'dca-1',
    owner: OWNER,
    type: 'dca',
    status: 'active',
    params: {
      tokenIn: TOKEN_IN,
      tokenOut: TOKEN_OUT,
      amountPerSwap: 10n * 10n ** 18n,
      intervalSeconds: 3_600,
      totalSwaps: 3,
      swapsCompleted: 0,
      nextExecution: 1_000,
      slippageBps: 100,
    },
    createdAt: 1_000,
    updatedAt: 1_000,
    retries: 0,
    maxRetries: 5,
    ...overrides,
  };
}
