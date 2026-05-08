export const __packageName = '@cfxdevkit/executor' as const;

export interface ExecutionContext {
  signal?: AbortSignal;
  attempt: number;
  metadata?: Record<string, unknown>;
}

export type ExecutionTask<T> = (context: ExecutionContext) => Promise<T> | T;

export interface RetryPolicy {
  attempts?: number;
  delayMs?: number | ((attempt: number, error: unknown) => number);
  shouldRetry?: (error: unknown, attempt: number) => boolean;
}

export interface ExecuteOptions extends RetryPolicy {
  signal?: AbortSignal;
  timeoutMs?: number;
  metadata?: Record<string, unknown>;
}

export type ExecutionResult<T> =
  | { ok: true; value: T; attempts: number; durationMs: number }
  | { ok: false; error: unknown; attempts: number; durationMs: number };

export interface BatchOptions extends ExecuteOptions {
  concurrency?: number;
  stopOnError?: boolean;
}

export interface TaskQueueOptions extends BatchOptions {
  onResult?: <T>(result: ExecutionResult<T>, taskIndex: number) => void;
}

export interface PollerContext {
  signal: AbortSignal;
}

export type PollerTask = (context: PollerContext) => Promise<void> | void;

export interface Poller {
  start(): void;
  stop(): Promise<void>;
  isRunning(): boolean;
}

const keyedLocks = new Map<string, Promise<void>>();

export async function execute<T>(
  task: ExecutionTask<T>,
  options: ExecuteOptions = {},
): Promise<ExecutionResult<T>> {
  const startedAt = Date.now();
  const attempts = Math.max(1, options.attempts ?? 1);
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    if (options.signal?.aborted) {
      return failure(options.signal.reason ?? new Error('execution aborted'), attempt, startedAt);
    }
    try {
      const context: ExecutionContext = {
        attempt,
        ...(options.signal ? { signal: options.signal } : {}),
        ...(options.metadata ? { metadata: options.metadata } : {}),
      };
      const value = await runWithTimeout(() => task(context), options.timeoutMs, options.signal);
      return { ok: true, value, attempts: attempt, durationMs: Date.now() - startedAt };
    } catch (error) {
      lastError = error;
      const shouldRetry =
        attempt < attempts && (options.shouldRetry ? options.shouldRetry(error, attempt) : true);
      if (!shouldRetry) return failure(error, attempt, startedAt);
      await delay(resolveRetryDelay(options.delayMs, attempt, error), options.signal);
    }
  }

  return failure(lastError, attempts, startedAt);
}

export async function executeBatch<T>(
  tasks: ReadonlyArray<ExecutionTask<T>>,
  options: BatchOptions = {},
): Promise<Array<ExecutionResult<T>>> {
  const concurrency = Math.max(1, options.concurrency ?? 1);
  const results: Array<ExecutionResult<T> | undefined> = new Array(tasks.length);
  let nextTaskIndex = 0;
  let stopped = false;

  async function worker(): Promise<void> {
    while (!stopped) {
      const taskIndex = nextTaskIndex;
      nextTaskIndex += 1;
      const task = tasks[taskIndex];
      if (!task) return;
      const result = await execute(task, options);
      results[taskIndex] = result;
      if (!result.ok && options.stopOnError) stopped = true;
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, tasks.length) }, () => worker()));
  return results.filter((result): result is ExecutionResult<T> => result !== undefined);
}

export function createTaskQueue(options: TaskQueueOptions = {}) {
  const tasks: Array<ExecutionTask<unknown>> = [];
  return {
    add<T>(task: ExecutionTask<T>): void {
      tasks.push(task as ExecutionTask<unknown>);
    },
    size(): number {
      return tasks.length;
    },
    async run(): Promise<Array<ExecutionResult<unknown>>> {
      const queued = tasks.splice(0, tasks.length);
      const results = await executeBatch(queued, options);
      for (const [taskIndex, result] of results.entries()) options.onResult?.(result, taskIndex);
      return results;
    },
  };
}

export function createPoller(task: PollerTask, intervalMs: number): Poller {
  const interval = Math.max(0, intervalMs);
  let controller: AbortController | undefined;
  let loopPromise: Promise<void> | undefined;
  let running = false;

  async function loop(signal: AbortSignal): Promise<void> {
    try {
      while (!signal.aborted) {
        await task({ signal });
        if (!signal.aborted) await delay(interval, signal);
      }
    } catch (error) {
      if (!signal.aborted) throw error;
    } finally {
      running = false;
    }
  }

  return {
    start(): void {
      if (running) return;
      controller = new AbortController();
      running = true;
      loopPromise = loop(controller.signal);
    },
    async stop(): Promise<void> {
      controller?.abort(new Error('poller stopped'));
      await loopPromise?.catch(() => undefined);
    },
    isRunning(): boolean {
      return running;
    },
  };
}

export async function withLock<T>(key: string, task: () => Promise<T> | T): Promise<T> {
  const previous = keyedLocks.get(key) ?? Promise.resolve();
  let release: () => void = () => undefined;
  const current = new Promise<void>((resolve) => {
    release = resolve;
  });
  const chained = previous.catch(() => undefined).then(() => current);
  keyedLocks.set(key, chained);

  await previous.catch(() => undefined);
  try {
    return await task();
  } finally {
    release();
    if (keyedLocks.get(key) === chained) keyedLocks.delete(key);
  }
}

function failure(error: unknown, attempts: number, startedAt: number): ExecutionResult<never> {
  return { ok: false, error, attempts, durationMs: Date.now() - startedAt };
}

async function runWithTimeout<T>(
  task: () => Promise<T> | T,
  timeoutMs?: number,
  signal?: AbortSignal,
): Promise<T> {
  if (timeoutMs === undefined) return task();
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(new Error(`execution timed out after ${timeoutMs}ms`)),
    timeoutMs,
  );
  const abort = signal
    ? new Promise<never>((_, reject) => {
        signal.addEventListener('abort', () => reject(signal.reason), { once: true });
      })
    : undefined;
  try {
    const timeoutPromise = new Promise<never>((_, reject) => {
      controller.signal.addEventListener('abort', () => reject(controller.signal.reason), {
        once: true,
      });
    });
    return await Promise.race([task(), timeoutPromise, ...(abort ? [abort] : [])]);
  } finally {
    clearTimeout(timeout);
  }
}

function resolveRetryDelay(
  delayMs: RetryPolicy['delayMs'],
  attempt: number,
  error: unknown,
): number {
  if (typeof delayMs === 'function') return Math.max(0, delayMs(attempt, error));
  return Math.max(0, delayMs ?? 0);
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timeout);
        reject(signal.reason);
      },
      { once: true },
    );
  });
}
