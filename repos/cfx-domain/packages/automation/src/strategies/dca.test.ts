import { describe, expect, it } from 'vitest';
import { PRICE_SCALE, PriceChecker, type PriceSource } from '../conditions/price.js';
import { SafetyGuard } from '../safety.js';
import { dcaJob } from '../test-helpers.js';
import { DCAEvaluator } from './dca.js';

class FixedPriceSource implements PriceSource {
  async getPrice(): Promise<bigint> {
    return PRICE_SCALE;
  }
}

describe('DCAEvaluator', () => {
  it('executes due DCA jobs', async () => {
    const result = await new DCAEvaluator().evaluate(dcaJob(), {
      nowSec: 1_000,
      priceChecker: new PriceChecker(new FixedPriceSource()),
      safetyGuard: new SafetyGuard(),
    });
    expect(result.shouldExecute).toBe(true);
  });

  it('skips jobs before the next interval', async () => {
    const result = await new DCAEvaluator().evaluate(
      dcaJob({ params: { ...dcaJob().params, nextExecution: 10_000 } }),
      {
        nowSec: 1,
        priceChecker: new PriceChecker(new FixedPriceSource()),
        safetyGuard: new SafetyGuard(),
      },
    );
    expect(result).toMatchObject({ shouldExecute: false, reason: 'dca_interval_not_elapsed' });
  });
});
