# `@cfxdevkit/executor` — API Reference

> Lightweight task execution engine with retry, timeout, abort, concurrency, and observable results.
> Intended for tooling and SDK workflows, not persistent job queues.

## Exports

```ts
// Core execution
async function execute<T>(
  task: ExecutionTask<T>,
  options?: ExecuteOptions,
): Promise<ExecutionResult<T>>

// Batch execution with configurable concurrency
async function executeBatch<T>(
  tasks: ReadonlyArray<ExecutionTask<T>>,
  options?: BatchOptions,
): Promise<Array<ExecutionResult<T>>>

// In-memory task queue
function createTaskQueue(options?: TaskQueueOptions): TaskQueue

// Exported types
type ExecutionTask<T> = (context: ExecutionContext) => Promise<T> | T
type ExecutionContext = { attempt: number; signal?: AbortSignal; metadata?: Record<string, unknown> }
type ExecutionResult<T> =
  | { ok: true; value: T; attempts: number; durationMs: number }
  | { ok: false; error: unknown; attempts: number; durationMs: number }
type ExecuteOptions = RetryPolicy & {
  signal?: AbortSignal
  timeoutMs?: number
  metadata?: Record<string, unknown>
}
type BatchOptions = ExecuteOptions & { concurrency?: number; stopOnError?: boolean }
type TaskQueueOptions = BatchOptions & { onResult?: <T>(result: ExecutionResult<T>, index: number) => void }
type TaskQueue = { add<T>(task: ExecutionTask<T>): void; size(): number; run(): Promise<Array<ExecutionResult<unknown>>> }
type RetryPolicy = {
  attempts?: number                              // max attempts, default 1
  delayMs?: number | ((attempt: number, error: unknown) => number)
  shouldRetry?: (error: unknown, attempt: number) => boolean  // default: always retry
}
```

## Usage

```ts
import { execute, executeBatch, createTaskQueue } from '@cfxdevkit/executor';

// Retry a flaky RPC call up to 3 times
const result = await execute(
  async () => client.getBlockNumber(),
  { attempts: 3, delayMs: 250 },
);
if (result.ok) console.log('Block:', result.value);
else console.error('Failed after', result.attempts, 'attempts');

// Deploy 5 contracts with 2 concurrent slots
const results = await executeBatch(
  contracts.map(c => () => deploy(c)),
  { concurrency: 2, attempts: 2 },
);

// Deferred batch collected before running
const queue = createTaskQueue({ concurrency: 3 });
queue.add(() => readBalance(addr1));
queue.add(() => readBalance(addr2));
const balances = await queue.run();
```

## Notes

- All results are returned as discriminated unions — failures never throw from `execute` / `executeBatch`.
- `timeoutMs` creates an internal `AbortController`; passing an external `signal` is additive.
- `shouldRetry: () => false` disables retry after the first failure regardless of `attempts`.
- `createTaskQueue` returns a single-use queue; call `add()` any number of times then `run()` once.
}): Executor
```

### Errors
`ExecutorError` codes:
- `executor/queue/full`
- `executor/job/timeout`
- `executor/job/non-retryable`         — handler threw a `CfxError` with `meta.retry === false`

---

## `executor/queues/memory`

```
function createMemoryQueue(opts?: { capacity?: number }): Queue
```

Tests + single-process projects.

---

## `executor/queues/redis`

```
function createRedisQueue(opts: {
  url: string
  prefix?: string                       // namespace
  visibilityTimeoutMs?: number          // default 30_000
  client?: RedisClient                  // injectable
}): Queue
```

Persistent. Multiple workers pull from same queue safely.

---

## `executor/scheduler`

```
type Trigger =
  | { kind: 'cron'; expression: string; tz?: string }
  | { kind: 'interval'; ms: DurationMs }
  | { kind: 'once'; at: Timestamp }

function createScheduler(input: {
  executor: Executor
  triggers: Array<{ jobKind: string; payload: unknown; trigger: Trigger }>
  clock?: () => Timestamp
}): { start(opts?: { signal?: AbortSignal }): Promise<void>; stop(): Promise<void> }
```

---

## `executor/observability`

```
type ExecutorEvent =
  | { kind: 'enqueue'; jobId: string; jobKind: string; at: Timestamp }
  | { kind: 'start'; jobId: string; attempt: number; at: Timestamp }
  | { kind: 'success'; jobId: string; durationMs: DurationMs; at: Timestamp }
  | { kind: 'failure'; jobId: string; attempt: number; error: { code: string; message: string }; willRetry: boolean; at: Timestamp }

type MetricsSink = {
  observe(name: string, value: number, tags?: Record<string, string>): void
  count(name: string, by?: number, tags?: Record<string, string>): void
}

const noopMetricsSink: MetricsSink
function createPrometheusSink(opts: { registry: PromRegistry; prefix?: string }): MetricsSink
```

---

## Anti-goals

- ❌ Chain-aware logic (gas, nonce, signers) — handlers receive a `Signer` they
  built themselves at registration time.
- ❌ Strategy abstractions — `domains/automation` defines those and registers
  handlers via `executor.register`.
