import { describe, expect, it } from 'vitest';
import { executionToCasDto, jobToCasDto } from './jobs.js';

describe('CAS job DTO helpers', () => {
  it('serializes bigint-backed job params for JSON APIs', () => {
    expect(
      jobToCasDto({
        id: 'job-1',
        owner: '0x0000000000000000000000000000000000000001',
        type: 'limit_order',
        status: 'active',
        params: {
          tokenIn: '0x0000000000000000000000000000000000000002',
          tokenOut: '0x0000000000000000000000000000000000000003',
          amountIn: 100n,
          minAmountOut: 90n,
          targetPrice: 2n,
          direction: 'gte',
        },
        createdAt: 1,
        updatedAt: 2,
        retries: 0,
        maxRetries: 5,
      }).params,
    ).toMatchObject({ amountIn: '100', minAmountOut: '90', targetPrice: '2' });
  });

  it('serializes execution amountOut values', () => {
    expect(
      executionToCasDto({ id: 1, jobId: 'job-1', txHash: '0xabc', timestamp: 3, amountOut: 4n }),
    ).toEqual({ id: 1, jobId: 'job-1', txHash: '0xabc', timestamp: 3, amountOut: '4' });
  });
});
