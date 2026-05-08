import { describe, expect, it } from 'vitest';
import { PRICE_SCALE, PriceChecker, type PriceSource } from '../conditions/price.js';
import { SafetyGuard } from '../safety.js';
import { twapJob } from '../testHelpers.js';
import { TWAPEvaluator } from './twap.js';

class FixedPriceSource implements PriceSource {
  async getPrice(): Promise<bigint> {
    return PRICE_SCALE;
  }
}

describe('TWAPEvaluator', () => {
  it('executes due TWAP tranches', async () => {
    const result = await new TWAPEvaluator().evaluate(twapJob(), {
      nowSec: 1_000,
      priceChecker: new PriceChecker(new FixedPriceSource()),
      safetyGuard: new SafetyGuard(),
    });

    expect(result.shouldExecute).toBe(true);
  });

  it('skips jobs before the next interval', async () => {
    const result = await new TWAPEvaluator().evaluate(
      twapJob({ params: { ...twapJob().params, nextExecution: 10_000 } }),
      {
        nowSec: 1,
        priceChecker: new PriceChecker(new FixedPriceSource()),
        safetyGuard: new SafetyGuard(),
      },
    );

    expect(result).toMatchObject({ shouldExecute: false, reason: 'twap_interval_not_elapsed' });
  });

  it('skips completed TWAP jobs', async () => {
    const result = await new TWAPEvaluator().evaluate(
      twapJob({ params: { ...twapJob().params, tranchesCompleted: 3, trancheCount: 3 } }),
      {
        nowSec: 10_000,
        priceChecker: new PriceChecker(new FixedPriceSource()),
        safetyGuard: new SafetyGuard(),
      },
    );

    expect(result).toMatchObject({ shouldExecute: false, reason: 'twap_completed' });
  });
});
