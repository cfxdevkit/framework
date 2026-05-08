import { describe, expect, it } from 'vitest';
import { dcaJob, limitOrderJob } from '../test-helpers.js';
import { DrizzleJobRepository } from './job-repository.js';
import { createSqliteDb } from './sqlite.js';

describe('DrizzleJobRepository', () => {
  it('creates and reads bigint-backed jobs', async () => {
    const { db } = createSqliteDb();
    const repository = new DrizzleJobRepository(db, { clock: () => 2_000 });

    await repository.create(limitOrderJob({ id: 'limit' }));
    const job = await repository.get('limit');

    expect(job).toMatchObject({ id: 'limit', type: 'limit_order', status: 'active' });
    expect(job?.type === 'limit_order' ? job.params.amountIn : 0n).toBe(100n * 10n ** 18n);
  });

  it('filters and updates jobs', async () => {
    const { db } = createSqliteDb();
    const repository = new DrizzleJobRepository(db, { clock: () => 2_000 });

    await repository.create(limitOrderJob({ id: 'limit', updatedAt: 1_000 }));
    await repository.create(dcaJob({ id: 'dca', updatedAt: 3_000 }));
    await repository.markFailed('limit', 'boom');

    expect(await repository.list({ status: 'failed' })).toMatchObject([{ id: 'limit' }]);
    expect(await repository.list({ type: 'dca' })).toMatchObject([{ id: 'dca' }]);
    expect(await repository.getUpdatedSince(2_500)).toMatchObject([{ id: 'dca' }]);
  });

  it('supports combined array filters and empty result sets', async () => {
    const { db } = createSqliteDb();
    const repository = new DrizzleJobRepository(db, { clock: () => 2_000 });

    await repository.create(limitOrderJob({ id: 'limit-a', status: 'active', updatedAt: 1_000 }));
    await repository.create(limitOrderJob({ id: 'limit-b', status: 'failed', updatedAt: 2_000 }));
    await repository.create(dcaJob({ id: 'dca-a', status: 'paused' }));

    await expect(
      repository.list({ status: ['active', 'failed'], type: ['limit_order'] }),
    ).resolves.toMatchObject([{ id: 'limit-b' }, { id: 'limit-a' }]);
    await expect(
      repository.list({ owner: '0x0000000000000000000000000000000000009999' }),
    ).resolves.toEqual([]);
  });

  it('orders updated-since results by timestamp inclusively', async () => {
    const { db } = createSqliteDb();
    const repository = new DrizzleJobRepository(db);

    await repository.create(limitOrderJob({ id: 'old', updatedAt: 999 }));
    await repository.create(dcaJob({ id: 'boundary', updatedAt: 1_000 }));
    await repository.create(limitOrderJob({ id: 'new', updatedAt: 1_500 }));

    await expect(repository.getUpdatedSince(1_000)).resolves.toMatchObject([
      { id: 'boundary' },
      { id: 'new' },
    ]);
  });

  it('enforces owner checks on cancel', async () => {
    const { db } = createSqliteDb();
    const repository = new DrizzleJobRepository(db);
    await repository.create(limitOrderJob({ id: 'limit' }));

    expect(await repository.cancel('limit', '0x0000000000000000000000000000000000009999')).toBe(
      'forbidden',
    );
    expect(await repository.cancel('limit')).toMatchObject({ status: 'cancelled' });
  });
});
