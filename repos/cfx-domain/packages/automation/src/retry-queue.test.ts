import { describe, expect, it } from 'vitest';
import { RetryQueue } from './retry-queue.js';
import { limitOrderJob } from './test-helpers.js';

describe('RetryQueue', () => {
  it('drains jobs only after their retry delay', () => {
    const queue = new RetryQueue({ baseDelayMs: 100, jitter: 0, random: () => 0 });
    queue.enqueue(limitOrderJob({ id: 'job-1', retries: 0 }), 1_000);

    expect(queue.drainDue(1_099)).toEqual([]);
    expect(queue.size()).toBe(1);
    expect(queue.drainDue(1_100)).toMatchObject([{ id: 'job-1' }]);
    expect(queue.size()).toBe(0);
  });

  it('uses job retry count for the initial backoff attempt', () => {
    const queue = new RetryQueue({ baseDelayMs: 100, jitter: 0, random: () => 0 });
    queue.enqueue(limitOrderJob({ id: 'job-1', retries: 2 }), 1_000);

    expect(queue.drainDue(1_399)).toEqual([]);
    expect(queue.drainDue(1_400)).toMatchObject([{ id: 'job-1' }]);
  });

  it('replaces queued entries by job id', () => {
    const queue = new RetryQueue({ baseDelayMs: 100, jitter: 0, random: () => 0 });
    queue.enqueue(limitOrderJob({ id: 'job-1', retries: 0 }), 1_000);
    queue.enqueue(limitOrderJob({ id: 'job-1', retries: 0 }), 1_000);

    expect(queue.size()).toBe(1);
  });

  it('removes queued entries before they are due', () => {
    const queue = new RetryQueue({ baseDelayMs: 100, jitter: 0, random: () => 0 });
    queue.enqueue(limitOrderJob({ id: 'job-1', retries: 0 }), 1_000);
    queue.remove('job-1');

    expect(queue.size()).toBe(0);
    expect(queue.drainDue(2_000)).toEqual([]);
  });

  it('caps exponential backoff before applying jitter', () => {
    const queue = new RetryQueue({
      baseDelayMs: 100,
      maxDelayMs: 250,
      jitter: 0.2,
      random: () => 1,
    });
    queue.enqueue(limitOrderJob({ id: 'job-1', retries: 10 }), 1_000);

    expect(queue.drainDue(1_299)).toEqual([]);
    expect(queue.drainDue(1_300)).toMatchObject([{ id: 'job-1' }]);
  });

  it('returns cloned jobs so queue state cannot be mutated by callers', () => {
    const queue = new RetryQueue({ baseDelayMs: 100, jitter: 0, random: () => 0 });
    const original = limitOrderJob({ id: 'job-1', retries: 0 });
    queue.enqueue(original, 1_000);

    const [drained] = queue.drainDue(1_100);
    if (drained?.type !== 'limit_order') throw new Error('expected limit order job');
    drained.params.amountIn = 0n;

    expect(original.params.amountIn).toBe(100n * 10n ** 18n);
  });
});
