import { describe, expect, it } from 'vitest';
import {
  formatCFX,
  parseCFX,
  formatDrip,
  parseDrip,
  formatGDrip,
  parseGDrip,
  formatToken,
  formatUnits,
  parseUnits,
  stringifyBigInt,
  MAX_UINT256,
  MAX_UINT128,
  ZERO_ADDRESS,
} from '@cfxdevkit/cdk/units';

describe('units', () => {
  it('formatCFX and parseCFX round-trip', () => {
    expect(formatCFX(1_000_000_000_000_000_000n)).toBe('1');
    expect(parseCFX('1.0')).toBe(1_000_000_000_000_000_000n);
    expect(parseCFX('0.5')).toBe(500_000_000_000_000_000n);
  });

  it('formatDrip and parseDrip are aliases of CFX helpers', () => {
    expect(formatDrip(1_000_000_000_000_000_000n)).toBe('1');
    expect(parseDrip('2.5')).toBe(2_500_000_000_000_000_000n);
  });

  it('formatGDrip and parseGDrip use 9 decimals', () => {
    expect(formatGDrip(1_000_000_000n)).toBe('1');
    expect(parseGDrip('1.0')).toBe(1_000_000_000n);
  });

  it('formatToken includes symbol', () => {
    expect(formatToken(100_000_000_000_000_000n, { decimals: 18, symbol: 'CFX' })).toBe('0.1 CFX');
    expect(formatToken(2_500_000n, { decimals: 6, symbol: 'USDC' })).toBe('2.5 USDC');
  });

  it('formatUnits and parseUnits work for arbitrary decimals', () => {
    expect(formatUnits(123_456_789n, 6)).toBe('123.456789');
    expect(parseUnits('123.456789', 6)).toBe(123_456_789n);
  });

  it('stringifyBigInt serialises bigint as decimal string', () => {
    expect(stringifyBigInt({ value: 123n })).toBe('{"value":"123"}');
    expect(stringifyBigInt([1n, 2n, 3n])).toBe('["1","2","3"]');
  });

  it('exports MAX constants', () => {
    expect(MAX_UINT256).toBe(2n ** 256n - 1n);
    expect(MAX_UINT128).toBe(2n ** 128n - 1n);
  });

  it('ZERO_ADDRESS is the null address', () => {
    expect(ZERO_ADDRESS).toBe('0x0000000000000000000000000000000000000000');
  });
});
