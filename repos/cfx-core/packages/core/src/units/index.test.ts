import { describe, expect, it } from 'vitest';
import {
  formatCFX,
  formatToken,
  formatUnits,
  parseCFX,
  parseUnits,
  stringifyBigInt,
} from './index.js';

describe('units', () => {
  it('parseUnits / formatUnits round-trip', () => {
    const wei = parseUnits('1.5', 18);
    expect(wei).toBe(1_500_000_000_000_000_000n);
    expect(formatUnits(wei, 18)).toBe('1.5');
  });

  it('formatToken appends symbol', () => {
    const wei = parseUnits('2', 6);
    expect(formatToken(wei, { decimals: 6, symbol: 'USDC' })).toBe('2 USDC');
  });

  it('formatCFX / parseCFX are 18-decimal helpers', () => {
    expect(parseCFX('0.001')).toBe(1_000_000_000_000_000n);
    expect(formatCFX(1_000_000_000_000_000n)).toBe('0.001');
  });

  it('stringifyBigInt serialises bigint as decimal string', () => {
    const out = stringifyBigInt({ amount: 12345n, label: 'x' });
    expect(JSON.parse(out)).toEqual({ amount: '12345', label: 'x' });
  });

  it('stringifyBigInt supports indent', () => {
    const out = stringifyBigInt({ a: 1n }, 2);
    expect(out).toContain('\n');
  });
});
