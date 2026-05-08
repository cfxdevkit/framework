import { describe, expect, it } from 'vitest';
import { buildSwapCalldata } from './calldata.js';

describe('buildSwapCalldata', () => {
  it('encodes a Swappi swapExactTokensForTokens call', () => {
    const calldata = buildSwapCalldata({
      tokenIn: '0x0000000000000000000000000000000000000001',
      tokenOut: '0x0000000000000000000000000000000000000002',
      amountIn: 100n,
      amountOutMin: 90n,
      recipient: '0x0000000000000000000000000000000000000003',
      deadline: 123n,
    });

    expect(calldata.startsWith('0x38ed1739')).toBe(true);
    expect(calldata).toContain('0000000000000000000000000000000000000000000000000000000000000064');
    expect(calldata).toContain('0000000000000000000000000000000000000003');
  });
});
