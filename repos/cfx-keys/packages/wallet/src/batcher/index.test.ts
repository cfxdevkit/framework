import { describe, expect, it } from 'vitest';
import { TransactionBatcher } from './index.js';

describe('TransactionBatcher', () => {
  it('executes tasks sequentially', async () => {
    const order: number[] = [];
    const batcher = new TransactionBatcher<number>();
    batcher.add(async () => {
      order.push(1);
      return 10;
    });
    batcher.add(async () => {
      order.push(2);
      return 20;
    });

    const results = await batcher.execute();

    expect(order).toEqual([1, 2]);
    expect(results).toMatchObject([
      { ok: true, value: 10 },
      { ok: true, value: 20 },
    ]);
    expect(batcher.size()).toBe(0);
  });

  it('stops after a failure when requested', async () => {
    const batcher = new TransactionBatcher<number>();
    batcher.add(() => {
      throw new Error('nope');
    });
    batcher.add(() => 2);

    const results = await batcher.execute({ stopOnFailure: true });

    expect(results).toHaveLength(1);
    expect(results[0]?.ok).toBe(false);
  });

  it('retries transient failures through executor policy', async () => {
    let attempts = 0;
    const batcher = new TransactionBatcher<number>({ attempts: 2 });
    batcher.add(() => {
      attempts += 1;
      if (attempts === 1) throw new Error('transient');
      return 7;
    });

    const [result] = await batcher.execute();

    expect(result).toMatchObject({ ok: true, value: 7, attempts: 2 });
  });
});
