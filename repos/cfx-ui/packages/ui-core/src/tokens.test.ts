import { describe, expect, it } from 'vitest';

import {
  CFX_NATIVE_ADDRESS,
  getPairedTokens,
  normalizeAddress,
  resolveTokenAddress,
  wcfxAddress,
} from './tokens.js';

const TOKENS = [
  { address: CFX_NATIVE_ADDRESS, symbol: 'CFX' },
  { address: wcfxAddress('testnet'), symbol: 'WCFX' },
  { address: '0x1000000000000000000000000000000000000001', symbol: 'USDT' },
  { address: '0x2000000000000000000000000000000000000002', symbol: 'ETH' },
] as const;

const PAIRS = [
  { token0: wcfxAddress('testnet'), token1: TOKENS[2].address },
  { token0: TOKENS[2].address, token1: TOKENS[3].address },
] as const;

describe('token helpers', () => {
  it('normalizes addresses to lowercase', () => {
    expect(normalizeAddress('0xABcd')).toBe('0xabcd');
  });

  it('maps the native token to wrapped CFX by default', () => {
    expect(resolveTokenAddress(CFX_NATIVE_ADDRESS)).toBe(wcfxAddress('testnet'));
    expect(resolveTokenAddress(TOKENS[2].address)).toBe(TOKENS[2].address);
  });

  it('returns all tokens when no input token is selected', () => {
    expect(getPairedTokens(PAIRS, TOKENS, '')).toEqual([...TOKENS]);
  });

  it('returns native CFX when the counterpart pair uses wrapped CFX', () => {
    expect(getPairedTokens(PAIRS, TOKENS, TOKENS[2].address)).toEqual([TOKENS[0], TOKENS[3]]);
  });
});
