import { describe, expect, it } from 'vitest';
import { ERC20_ABI, ERC721_ABI, ERC1155_ABI, MULTICALL3_ABI, MULTICALL3_ADDRESS } from './index.js';

describe('@cfxdevkit/contracts/abis', () => {
  it('exposes the standard ABI shapes', () => {
    expect(Array.isArray(ERC20_ABI)).toBe(true);
    expect(Array.isArray(ERC721_ABI)).toBe(true);
    expect(Array.isArray(ERC1155_ABI)).toBe(true);
    expect(Array.isArray(MULTICALL3_ABI)).toBe(true);
  });

  it('ERC20 ABI contains the canonical functions', () => {
    const fns = (ERC20_ABI as readonly { type: string; name?: string }[])
      .filter((e) => e.type === 'function')
      .map((e) => e.name);
    for (const required of [
      'name',
      'symbol',
      'decimals',
      'totalSupply',
      'balanceOf',
      'allowance',
      'approve',
      'transfer',
      'transferFrom',
    ]) {
      expect(fns).toContain(required);
    }
  });

  it('Multicall3 deployment address is the canonical one', () => {
    expect(MULTICALL3_ADDRESS).toBe('0xcA11bde05977b3631167028862bE2a173976CA11');
  });
});
