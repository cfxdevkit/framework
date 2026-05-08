import { describe, expect, it } from 'vitest';
import type { DCAStrategy, LimitOrderStrategy, Strategy } from './input.js';

describe('strategy input types', () => {
  it('models human-readable limit order input', () => {
    const strategy = {
      kind: 'limit_order',
      tokenIn: '0x0000000000000000000000000000000000000001',
      tokenOut: '0x0000000000000000000000000000000000000002',
      amountIn: '100.5',
      targetPrice: '2.0',
      direction: 'gte',
      slippageBps: 100,
      expiresInDays: null,
    } satisfies LimitOrderStrategy;

    expect(strategy.amountIn).toBe('100.5');
  });

  it('models human-readable dca input', () => {
    const strategy = {
      kind: 'dca',
      tokenIn: '0x0000000000000000000000000000000000000001',
      tokenOut: '0x0000000000000000000000000000000000000002',
      amountPerSwap: '10',
      intervalHours: 24,
      totalSwaps: 5,
      slippageBps: 50,
    } satisfies DCAStrategy;

    const union: Strategy = strategy;
    expect(union.kind).toBe('dca');
  });
});
