import { describe, expect, it } from 'vitest';
import { dcaJob, limitOrderJob, OWNER } from '../testHelpers.js';
import { MemoryExecutionRepository, MemoryJobRepository } from './memory.js';

describe('MemoryJobRepository', () => {
  it('creates, lists, and filters jobs', async () => {
    const repository = new MemoryJobRepository();
    const limitOrder = await repository.create(limitOrderJob({ id: 'limit' }));
    await repository.create(
      dcaJob({ id: 'dca', owner: '0x0000000000000000000000000000000000000004' }),
    );

    expect(limitOrder.id).toBe('limit');
    expect(await repository.list()).toHaveLength(2);
    expect(await repository.list({ owner: OWNER })).toHaveLength(1);
    expect(await repository.list({ type: 'dca' })).toHaveLength(1);
  });

  it('updates lifecycle state', async () => {
    const repository = new MemoryJobRepository();
    await repository.create(limitOrderJob({ id: 'job' }));

    await repository.incrementRetry('job', 'temporary');
    expect((await repository.get('job'))?.retries).toBe(1);
    expect((await repository.get('job'))?.lastError).toBe('temporary');

    await repository.markExecuted('job', { txHash: '0xabc' });
    expect((await repository.get('job'))?.status).toBe('executed');
    expect(await repository.cancel('job', OWNER)).toBeUndefined();
  });

  it('guards owner cancellation', async () => {
    const repository = new MemoryJobRepository();
    await repository.create(limitOrderJob({ id: 'job' }));
    expect(await repository.cancel('job', '0x0000000000000000000000000000000000000005')).toBe(
      'forbidden',
    );
    expect((await repository.cancel('job', OWNER))?.status).toBe('cancelled');
  });
});

describe('MemoryExecutionRepository', () => {
  it('stores execution records', async () => {
    const repository = new MemoryExecutionRepository();
    await repository.create({ jobId: 'job', txHash: '0xabc', amountOut: 10n });
    await repository.create({ jobId: 'other', txHash: '0xdef' });
    expect(await repository.listByJob('job')).toMatchObject([{ jobId: 'job', amountOut: 10n }]);
  });
});
