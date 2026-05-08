import { describe, expect, it } from 'vitest';
import {
  __packageName,
  createPoller,
  createTaskQueue,
  execute,
  executeBatch,
  withLock,
} from './index.js';

describe('@cfxdevkit/executor', () => {
  it('exposes its package name', () => {
    expect(__packageName).toBe('@cfxdevkit/executor');
  });

  it('retries failed tasks', async () => {
    let attempts = 0;
    const result = await execute(
      () => {
        attempts += 1;
        if (attempts < 2) throw new Error('again');
        return 'ok';
      },
      { attempts: 2 },
    );
    expect(result).toMatchObject({ ok: true, value: 'ok', attempts: 2 });
  });

  it('returns failed results when retry policy declines', async () => {
    const result = await execute(
      () => {
        throw new Error('nope');
      },
      { attempts: 3, shouldRetry: () => false },
    );
    expect(result).toMatchObject({ ok: false, attempts: 1 });
  });

  it('returns failed results when aborted before execution', async () => {
    const controller = new AbortController();
    controller.abort(new Error('stop'));
    const result = await execute(() => 'never', { signal: controller.signal });
    expect(result).toMatchObject({ ok: false, attempts: 1 });
  });

  it('times out slow tasks', async () => {
    const result = await execute(
      () => new Promise((resolve) => setTimeout(() => resolve('late'), 20)),
      { timeoutMs: 1 },
    );
    expect(result.ok).toBe(false);
  });

  it('runs batches with concurrency', async () => {
    const results = await executeBatch([() => 1, () => 2, () => 3], { concurrency: 2 });
    expect(results.map((result) => (result.ok ? result.value : 0))).toEqual([1, 2, 3]);
  });

  it('drains task queues', async () => {
    const seen: unknown[] = [];
    const queue = createTaskQueue();
    queue.add(() => 'a');
    queue.add(() => 'b');
    expect(queue.size()).toBe(2);
    const results = await queue.run();
    expect(results.map((result) => (result.ok ? result.value : ''))).toEqual(['a', 'b']);
    expect(queue.size()).toBe(0);

    const observedQueue = createTaskQueue({ onResult: (result) => seen.push(result.ok) });
    observedQueue.add(() => 'c');
    await observedQueue.run();
    expect(seen).toEqual([true]);
  });

  it('runs poller ticks until stopped', async () => {
    let ticks = 0;
    const poller = createPoller(() => {
      ticks += 1;
    }, 1);

    poller.start();
    expect(poller.isRunning()).toBe(true);
    await new Promise((resolve) => setTimeout(resolve, 5));
    await poller.stop();

    expect(poller.isRunning()).toBe(false);
    expect(ticks).toBeGreaterThan(0);
  });

  it('serializes tasks sharing the same lock key', async () => {
    const order: string[] = [];

    await Promise.all([
      withLock('job:1', async () => {
        order.push('a:start');
        await new Promise((resolve) => setTimeout(resolve, 5));
        order.push('a:end');
      }),
      withLock('job:1', () => {
        order.push('b:start');
        order.push('b:end');
      }),
    ]);

    expect(order).toEqual(['a:start', 'a:end', 'b:start', 'b:end']);
  });
});
