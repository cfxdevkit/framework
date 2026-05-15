import { describe, expect, it } from 'vitest';

import {
  CFX_NATIVE_ADDRESS,
  DEFAULT_MAINNET_PAIRS,
  DEFAULT_MAINNET_TOKENS,
  getDisplayTokens,
  getPairedTokens,
  normalizeAddress,
  resolveDisplayTokenAddress,
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
const KNOWN_SPAM_TOKEN = '0x444449e9e35d51e5742bf52207879047946526d2';

describe('token helpers', () => {
  it('normalizes addresses to lowercase', () => {
    expect(normalizeAddress('0xABcd')).toBe('0xabcd');
  });

  it('maps the native token to wrapped CFX by default', () => {
    expect(resolveTokenAddress(CFX_NATIVE_ADDRESS)).toBe(wcfxAddress('testnet'));
    expect(resolveTokenAddress(TOKENS[2].address)).toBe(TOKENS[2].address);
  });

  it('maps wrapped CFX back to the native display token', () => {
    expect(resolveDisplayTokenAddress(wcfxAddress('testnet'))).toBe(CFX_NATIVE_ADDRESS);
    expect(resolveDisplayTokenAddress(TOKENS[2].address)).toBe(TOKENS[2].address);
  });

  it('removes wrapped CFX from display token lists', () => {
    expect(getDisplayTokens(TOKENS)).toEqual([TOKENS[0], TOKENS[2], TOKENS[3]]);
  });

  it('returns all tokens when no input token is selected', () => {
    expect(getPairedTokens(PAIRS, TOKENS, '')).toEqual([...TOKENS]);
  });

  it('returns native CFX when the counterpart pair uses wrapped CFX', () => {
    expect(getPairedTokens(PAIRS, TOKENS, TOKENS[2].address)).toEqual([TOKENS[0], TOKENS[3]]);
  });

  it('filters the known spam token from the generated mainnet defaults', () => {
    expect(
      DEFAULT_MAINNET_TOKENS.some(
        (token) => normalizeAddress(token.address) === normalizeAddress(KNOWN_SPAM_TOKEN),
      ),
    ).toBe(false);
    expect(
      DEFAULT_MAINNET_PAIRS.some(
        (pair) =>
          normalizeAddress(pair.token0) === normalizeAddress(KNOWN_SPAM_TOKEN) ||
          normalizeAddress(pair.token1) === normalizeAddress(KNOWN_SPAM_TOKEN),
      ),
    ).toBe(false);
  });
});
