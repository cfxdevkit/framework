import { describe, expect, it } from 'vitest';
import { SwapExecutor, transferTopic } from './executor.js';

const router = '0x00000000000000000000000000000000000000aa' as const;

describe('SwapExecutor', () => {
  it('quotes using getAmountsOut', async () => {
    const executor = new SwapExecutor({
      router,
      client: {
        async readContract(input) {
          expect(input.address).toBe(router);
          expect(input.functionName).toBe('getAmountsOut');
          return [input.args[0], 42n];
        },
      },
    });

    await expect(
      executor.quote(
        '0x0000000000000000000000000000000000000001',
        '0x0000000000000000000000000000000000000002',
        10n,
      ),
    ).resolves.toBe(42n);
  });

  it('decodes amountOut from the final Transfer to the recipient', async () => {
    const recipient = '0x0000000000000000000000000000000000000003' as const;
    const executor = new SwapExecutor({
      router,
      client: {
        async readContract() {
          return [1n, 2n];
        },
        async simulateContract(input) {
          return { request: input };
        },
        async writeContract() {
          return '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
        },
        async waitForTransactionReceipt() {
          return {
            status: 'success',
            logs: [
              {
                topics: [
                  transferTopic(),
                  `0x${'0'.repeat(24)}0000000000000000000000000000000000000001`,
                  `0x${'0'.repeat(24)}${recipient.slice(2)}`,
                ],
                data: `0x${'0'.repeat(63)}5`,
              },
            ],
          };
        },
      },
    });

    const result = await executor.execute({
      tokenIn: '0x0000000000000000000000000000000000000001',
      tokenOut: '0x0000000000000000000000000000000000000002',
      amountIn: 10n,
      recipient,
      deadline: 123n,
    });

    expect(result.amountOut).toBe(5n);
    expect(result.calldata.startsWith('0x38ed1739')).toBe(true);
  });
});
