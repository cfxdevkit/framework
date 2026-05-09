import { describe, expect, it } from 'vitest';
import {
  buildAddChainParams,
  CORE_CHAIN_CONFIGS,
  formatProviderError,
  getCoreChainConfig,
  normalizeCoreChainId,
} from './coreWalletPrimitives.js';

describe('core wallet primitives', () => {
  it('normalizes numeric and hex core chain identifiers', () => {
    expect(normalizeCoreChainId('1029')).toBe('0x405');
    expect(normalizeCoreChainId('0x405')).toBe('0x405');
    expect(normalizeCoreChainId('0xNaN')).toBe('0xNaN');
  });

  it('looks up core chain config by hex id', () => {
    expect(getCoreChainConfig('0x405')).toEqual(CORE_CHAIN_CONFIGS[1029]);
    expect(getCoreChainConfig('0xbeef')).toBeNull();
  });

  it('builds add-chain params from the framework core chain catalog', () => {
    expect(buildAddChainParams(CORE_CHAIN_CONFIGS[2029])).toEqual({
      chainId: '0x7ed',
      chainName: 'Conflux Conflux Core Space (local)',
      nativeCurrency: { name: 'Conflux', symbol: 'CFX', decimals: 18 },
      rpcUrls: ['http://127.0.0.1:12537'],
    });
  });

  it('extracts provider error messages from arbitrary values', () => {
    expect(formatProviderError(new Error('boom'))).toBe('boom');
    expect(formatProviderError({ message: 'wallet rejected' })).toBe('wallet rejected');
    expect(formatProviderError(123)).toBe('123');
  });
});
