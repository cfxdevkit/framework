import { describe, expect, it } from 'vitest';
import { SwappiPriceSource } from './swappi.js';

describe('SwappiPriceSource', () => {
  it('uses router quotes as normalized prices', async () => {
    const source = new SwappiPriceSource({
      reader: {
        async getAmountsOut() {
          return [10n ** 18n, 2n * 10n ** 18n];
        },
      },
    });
    expect(await source.getPrice('0xin', '0xout')).toBe(2n * 10n ** 18n);
  });
});
