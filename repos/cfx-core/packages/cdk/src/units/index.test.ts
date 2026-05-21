import { describe, expect, it } from 'vitest';
import {
  formatCFX,
  formatDrip,
  formatGDrip,
  formatToken,
  formatUnits,
  MAX_UINT128,
  MAX_UINT256,
  parseCFX,
  parseDrip,
  parseGDrip,
  parseUnits,
  stringifyBigInt,
  ZERO_ADDRESS,
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

  it('formatDrip / parseDrip are 18-decimal aliases for CFX', () => {
    expect(parseDrip('1')).toBe(10n ** 18n);
    expect(formatDrip(10n ** 18n)).toBe('1');
  });

  it('formatGDrip / parseGDrip are 9-decimal helpers (gas-price unit)', () => {
    // 1 Gdrip = 1e9 drip
    expect(parseGDrip('1')).toBe(1_000_000_000n);
    expect(formatGDrip(20_000_000_000n)).toBe('20');
  });

  it('stringifyBigInt serialises bigint as decimal string', () => {
    const out = stringifyBigInt({ amount: 12345n, label: 'x' });
    expect(JSON.parse(out)).toEqual({ amount: '12345', label: 'x' });
  });

  it('stringifyBigInt supports indent', () => {
    const out = stringifyBigInt({ a: 1n }, 2);
    expect(out).toContain('\n');
  });

  it('exports common EVM constants', () => {
    expect(MAX_UINT128).toBe(2n ** 128n - 1n);
    expect(MAX_UINT256).toBe(2n ** 256n - 1n);
    expect(ZERO_ADDRESS).toBe('0x0000000000000000000000000000000000000000');
  });
});
