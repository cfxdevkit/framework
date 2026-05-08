import { describe, expect, it } from 'vitest';
import { PRICE_SCALE, PriceChecker, type PriceSource } from '../conditions/price.js';
import { SafetyGuard } from '../safety.js';
import { limitOrderJob } from '../test-helpers.js';
import { LimitOrderEvaluator } from './limit-order.js';

class FixedPriceSource implements PriceSource {
  constructor(readonly price: bigint) {}

  async getPrice(): Promise<bigint> {
    return this.price;
  }
}

describe('LimitOrderEvaluator', () => {
  it('executes when price and safety checks pass', async () => {
    const evaluator = new LimitOrderEvaluator();
    const result = await evaluator.evaluate(limitOrderJob(), {
      nowSec: 1,
      priceChecker: new PriceChecker(new FixedPriceSource(3n * PRICE_SCALE)),
      safetyGuard: new SafetyGuard(),
    });
    expect(result.shouldExecute).toBe(true);
  });

  it('skips unmet price conditions', async () => {
    const evaluator = new LimitOrderEvaluator();
    const result = await evaluator.evaluate(limitOrderJob(), {
      nowSec: 1,
      priceChecker: new PriceChecker(new FixedPriceSource(PRICE_SCALE)),
      safetyGuard: new SafetyGuard(),
    });
    expect(result).toMatchObject({ shouldExecute: false, reason: 'price_condition_not_met' });
  });
});
