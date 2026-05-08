import { describe, expect, it } from 'vitest';
import { PRICE_SCALE, PriceChecker, type PriceSource } from '../conditions/price.js';
import { SafetyGuard } from '../safety.js';
import { swapJob } from '../test-helpers.js';
import { SwapEvaluator } from './swap.js';

class FixedPriceSource implements PriceSource {
  async getPrice(): Promise<bigint> {
    return PRICE_SCALE;
  }
}

describe('SwapEvaluator', () => {
  it('executes active swap jobs when safety checks pass', async () => {
    const result = await new SwapEvaluator().evaluate(swapJob(), {
      nowSec: 1_000,
      priceChecker: new PriceChecker(new FixedPriceSource()),
      safetyGuard: new SafetyGuard(),
    });

    expect(result.shouldExecute).toBe(true);
  });
});
