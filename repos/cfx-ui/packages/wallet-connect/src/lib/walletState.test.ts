import { describe, expect, it } from 'vitest';
import {
  coreChainLabel,
  deriveCoreState,
  deriveESpaceState,
  espaceChainLabel,
  needsESpaceSwitch,
} from './walletState.js';

describe('wallet state helpers', () => {
  it('derives core pill state', () => {
    expect(deriveCoreState('active', '0x405', '0x405')).toEqual({
      isPending: false,
      isActive: true,
      canConnect: false,
      onCorrectChain: true,
      showSwitch: false,
    });
  });

  it('derives espace pill state and switch need', () => {
    expect(deriveESpaceState(true, 71, 1030)).toEqual({
      isConnected: true,
      onCorrectChain: false,
      showSwitch: true,
    });
    expect(needsESpaceSwitch(true, 71, 1030)).toBe(true);
    expect(needsESpaceSwitch(false, 71, 1030)).toBe(false);
  });

  it('returns readable chain labels', () => {
    expect(coreChainLabel('0x405')).toBe('Conflux Core Space');
    expect(espaceChainLabel(2030)).toBe('eSpace Local');
  });
});
