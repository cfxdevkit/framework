import { describe, expect, it } from 'vitest';
import { coreChainLabel, espaceChainLabel } from './wallet-state.js';

describe('coreChainLabel', () => {
  it('returns mainnet label for 0x405', () => expect(coreChainLabel('0x405')).toBe('Core Mainnet'));
  it('returns testnet label for 0x1', () => expect(coreChainLabel('0x1')).toBe('Core Testnet'));
  it('returns local label for 0xc9', () => expect(coreChainLabel('0xc9')).toBe('Core Local'));
  it('case-insensitive for 0X405', () => expect(coreChainLabel('0X405')).toBe('Core Mainnet'));
  it('returns fallback for unknown chain', () =>
    expect(coreChainLabel('0xabc')).toBe('chain 0xabc'));
  it('returns fallback for undefined', () => expect(coreChainLabel(undefined)).toBe('unknown'));
});

describe('espaceChainLabel', () => {
  it('returns mainnet label for 1030', () => expect(espaceChainLabel(1030)).toBe('eSpace Mainnet'));
  it('returns testnet label for 71', () => expect(espaceChainLabel(71)).toBe('eSpace Testnet'));
  it('returns local label for 2030', () => expect(espaceChainLabel(2030)).toBe('eSpace Local'));
  it('returns fallback for unknown chain', () => expect(espaceChainLabel(999)).toBe('chain 999'));
});
