import { describe, expect, it } from 'vitest';
import {
  ADMIN_CONTROL_ABI,
  CFX_NATIVE_ADDRESS,
  CONFLUX_PRECOMPILE_ADDRESSES,
  CROSS_SPACE_CALL_ABI,
  POS_REGISTER_ABI,
  SPONSOR_WHITELIST_ABI,
  STAKING_ABI,
  WCFX_ABI,
  WCFX_ADDRESSES,
} from './index.js';

type AbiEntry = { type: string; name?: string };

function functionNames(abi: readonly AbiEntry[]): string[] {
  return abi.filter((entry) => entry.type === 'function').map((entry) => entry.name ?? '');
}

function expectFunctions(abi: readonly AbiEntry[], names: readonly string[]) {
  expect(functionNames(abi)).toEqual(expect.arrayContaining(names));
}

describe('@cfxdevkit/protocol precompiles', () => {
  it('exports canonical precompile addresses', () => {
    for (const address of Object.values(CONFLUX_PRECOMPILE_ADDRESSES)) {
      expect(address).toMatch(/^0x[0-9a-fA-F]{40}$/);
      expect(address.startsWith('0x088800000000000000000000000000000000000')).toBe(true);
    }
  });

  it('exports non-empty ABI arrays', () => {
    expect(ADMIN_CONTROL_ABI.length).toBeGreaterThan(0);
    expect(SPONSOR_WHITELIST_ABI.length).toBeGreaterThan(0);
    expect(STAKING_ABI.length).toBeGreaterThan(0);
    expect(CROSS_SPACE_CALL_ABI.length).toBeGreaterThan(0);
    expect(POS_REGISTER_ABI.length).toBeGreaterThan(0);
  });

  it('exports expected precompile function surfaces', () => {
    expectFunctions(ADMIN_CONTROL_ABI, ['getAdmin', 'setAdmin', 'destroy']);
    expectFunctions(SPONSOR_WHITELIST_ABI, [
      'getSponsorForGas',
      'addPrivilege',
      'setSponsorForCollateral',
    ]);
    expectFunctions(STAKING_ABI, ['deposit', 'withdraw', 'voteLock']);
    expectFunctions(CROSS_SPACE_CALL_ABI, ['callEVM', 'staticCallEVM', 'withdrawFromMapped']);
    expectFunctions(POS_REGISTER_ABI, ['register', 'increaseStake', 'retire']);
  });

  it('exports WCFX ABI and canonical addresses', () => {
    expect(CFX_NATIVE_ADDRESS).toBe('0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE');
    expect(WCFX_ADDRESSES.testnet).toBe('0x2ED3dddae5B2F321AF0806181FBFA6D049Be47d8');
    expect(WCFX_ADDRESSES.mainnet).toBe('0x14b2D3bC65e74DAE1030EAFd8ac30c533c976A9b');
    expect(WCFX_ADDRESSES.local).toBeNull();
    expectFunctions(WCFX_ABI, [
      'deposit',
      'withdraw',
      'balanceOf',
      'allowance',
      'approve',
      'transfer',
    ]);
  });
});
