import { describe, expect, it } from 'vitest';
import { GeckoTerminalPriceSource } from './gecko-terminal.js';

describe('GeckoTerminalPriceSource', () => {
  it('normalizes token price ratios', async () => {
    const responses = new Map([
      ['0xin', 2],
      ['0xout', 4],
    ]);
    const source = new GeckoTerminalPriceSource({
      network: 'conflux-espace',
      fetcher: async (input) => {
        const token = String(input).split('/').at(-1) ?? '';
        return Response.json({ data: { attributes: { price_usd: responses.get(token) } } });
      },
    });
    expect(await source.getPrice('0xin', '0xout')).toBe(500000000000000000n);
  });
});
