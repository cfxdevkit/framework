import type { Job } from './types.js';

export interface RetryQueueOptions {
  baseDelayMs?: number;
  maxDelayMs?: number;
  jitter?: number;
  random?: () => number;
}

interface RetryEntry {
  job: Job;
  nextRetryAt: number;
  attempt: number;
}

export class RetryQueue {
  readonly #baseDelayMs: number;
  readonly #maxDelayMs: number;
  readonly #jitter: number;
  readonly #random: () => number;
  readonly #queue = new Map<string, RetryEntry>();

  constructor(options: RetryQueueOptions = {}) {
    this.#baseDelayMs = options.baseDelayMs ?? 5_000;
    this.#maxDelayMs = options.maxDelayMs ?? 300_000;
    this.#jitter = options.jitter ?? 0.2;
    this.#random = options.random ?? Math.random;
  }

  enqueue(job: Job, now = Date.now()): void {
    const existing = this.#queue.get(job.id);
    const attempt = existing ? existing.attempt + 1 : job.retries;
    const nextRetryAt = now + this.#backoffDelay(attempt);
    this.#queue.set(job.id, { job: cloneJob(job), nextRetryAt, attempt });
  }

  remove(jobId: string): void {
    this.#queue.delete(jobId);
  }

  drainDue(now = Date.now()): Job[] {
    const due: Job[] = [];
    for (const [jobId, entry] of this.#queue) {
      if (now >= entry.nextRetryAt) {
        due.push(cloneJob(entry.job));
        this.#queue.delete(jobId);
      }
    }
    return due;
  }

  size(): number {
    return this.#queue.size;
  }

  #backoffDelay(attempt: number): number {
    const exponential = this.#baseDelayMs * 2 ** Math.max(0, attempt);
    const capped = Math.min(exponential, this.#maxDelayMs);
    return Math.floor(capped * (1 + this.#jitter * this.#random()));
  }
}

function cloneJob<T extends Job>(job: T): T {
  return { ...job, params: { ...job.params } } as T;
}
