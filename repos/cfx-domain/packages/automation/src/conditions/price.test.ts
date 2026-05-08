import { describe, expect, it } from 'vitest';
import { dcaJob, limitOrderJob } from '../testHelpers.js';
import { estimateUsdValue, PRICE_SCALE, PriceChecker, type PriceSource } from './price.js';

class FixedPriceSource implements PriceSource {
  constructor(readonly price: bigint) {}

  async getPrice(): Promise<bigint> {
    return this.price;
  }
}

describe('PriceChecker', () => {
  it('evaluates limit order price direction', async () => {
    const checker = new PriceChecker(new FixedPriceSource(3n * PRICE_SCALE));
    const result = await checker.checkLimitOrder(limitOrderJob());
    expect(result.conditionMet).toBe(true);
    expect(result.currentPrice).toBe(3n * PRICE_SCALE);
  });

  it('evaluates DCA due state', async () => {
    const checker = new PriceChecker(new FixedPriceSource(PRICE_SCALE));
    const result = await checker.checkDCA(dcaJob(), 1_000);
    expect(result.conditionMet).toBe(true);
  });

  it('estimates scaled USD values', () => {
    expect(estimateUsdValue(2n * 10n ** 18n, 3n * PRICE_SCALE)).toBe(6);
  });
});
