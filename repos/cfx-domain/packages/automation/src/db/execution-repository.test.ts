import { describe, expect, it } from 'vitest';
import { dcaJob, limitOrderJob } from '../test-helpers.js';
import { DrizzleExecutionRepository } from './execution-repository.js';
import { DrizzleJobRepository } from './job-repository.js';
import { createSqliteDb } from './sqlite.js';

describe('DrizzleExecutionRepository', () => {
  it('records and lists executions by job', async () => {
    const { db } = createSqliteDb();
    const jobs = new DrizzleJobRepository(db);
    const repository = new DrizzleExecutionRepository(db, { clock: () => 2_000 });

    await jobs.create(limitOrderJob({ id: 'job-1' }));
    await jobs.create(dcaJob({ id: 'job-2' }));

    await repository.create({ jobId: 'job-1', txHash: '0xabc', amountOut: 123n });
    await repository.create({ jobId: 'job-2', txHash: '0xdef', amountOut: 456n });

    expect(await repository.listByJob('job-1')).toEqual([
      { id: 1, jobId: 'job-1', txHash: '0xabc', timestamp: 2_000, amountOut: 123n },
    ]);
  });

  it('orders multiple executions by timestamp and preserves optional amountOut', async () => {
    const { db } = createSqliteDb();
    const jobs = new DrizzleJobRepository(db);
    const repository = new DrizzleExecutionRepository(db);

    await jobs.create(limitOrderJob({ id: 'job-1' }));

    await repository.create({ jobId: 'job-1', txHash: '0xccc', timestamp: 3_000 });
    await repository.create({ jobId: 'job-1', txHash: '0xaaa', timestamp: 1_000, amountOut: 1n });
    await repository.create({ jobId: 'job-1', txHash: '0xbbb', timestamp: 2_000, amountOut: 2n });

    expect(await repository.listByJob('job-1')).toEqual([
      { id: 2, jobId: 'job-1', txHash: '0xaaa', timestamp: 1_000, amountOut: 1n },
      { id: 3, jobId: 'job-1', txHash: '0xbbb', timestamp: 2_000, amountOut: 2n },
      { id: 1, jobId: 'job-1', txHash: '0xccc', timestamp: 3_000 },
    ]);
  });
});
