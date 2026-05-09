import { describe, expect, it } from 'vitest';
import {
  __packageName,
  CORE_CHAIN_CONFIGS,
  createSupportedEspaceChains,
  errMsg,
  needsESpaceSwitch,
} from './index.js';

describe('@cfxdevkit/wallet-connect', () => {
  it('exposes its package name', () => {
    expect(__packageName).toBe('@cfxdevkit/wallet-connect');
  });

  it('re-exports wallet helpers from the package root', () => {
    expect(CORE_CHAIN_CONFIGS[1029]?.chainIdHex).toBe('0x405');
    expect(createSupportedEspaceChains().map((chain) => chain.id)).toEqual([1030, 71, 2030]);
    expect(needsESpaceSwitch(true, 71, 1030)).toBe(true);
    expect(errMsg({ message: 'wallet failed' })).toBe('wallet failed');
  });
});
