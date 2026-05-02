import { describe, expect, it } from 'vitest';
import { getBool, getNumber, getString } from './args.js';

describe('getString', () => {
  it('returns string value when present', () => {
    expect(getString({ key: 'value' }, 'key')).toBe('value');
  });

  it('returns undefined for missing key', () => {
    expect(getString({ key: 'value' }, 'missing')).toBeUndefined();
  });

  it('returns undefined for boolean flag', () => {
    expect(getString({ flag: true }, 'flag')).toBeUndefined();
  });
});

describe('getNumber', () => {
  it('returns parsed number for numeric string', () => {
    expect(getNumber({ count: '3' }, 'count')).toBe(3);
  });

  it('returns undefined for non-numeric string', () => {
    expect(getNumber({ count: 'abc' }, 'count')).toBeUndefined();
  });

  it('returns undefined for boolean flag', () => {
    expect(getNumber({ flag: true }, 'flag')).toBeUndefined();
  });

  it('returns undefined for NaN/Infinity', () => {
    expect(getNumber({ count: 'NaN' }, 'count')).toBeUndefined();
    expect(getNumber({ count: 'Infinity' }, 'count')).toBeUndefined();
  });
});

describe('getBool', () => {
  it('returns true for boolean true', () => {
    expect(getBool({ flag: true }, 'flag')).toBe(true);
  });

  it('returns true for string "true"', () => {
    expect(getBool({ flag: 'true' }, 'flag')).toBe(true);
  });

  it('returns false for other values', () => {
    expect(getBool({ flag: 'false' }, 'flag')).toBe(false);
    expect(getBool({ flag: 1 }, 'flag')).toBe(false);
    expect(getBool({}, 'flag')).toBe(false);
  });
});
