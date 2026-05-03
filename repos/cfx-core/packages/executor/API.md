# framework/executor — Public API

> Background job runner. **Generic**: knows nothing about DEX, games, or hardware.
> Strategies (job definitions and handler registration) are defined in `@cfxdevkit/automation`.

## Sub-paths

| Sub-path | Concern |
|----------|---------|
| `@cfxdevkit/executor` | `Executor` interface + `createExecutor` |
| `@cfxdevkit/executor/queues/memory` | in-memory queue |
| `@cfxdevkit/executor/queues/redis` | Redis-backed queue |
| `@cfxdevkit/executor/scheduler` | cron / interval triggers |
| `@cfxdevkit/executor/observability` | metrics + structured logs |
| `@cfxdevkit/executor/errors` | `ExecutorError` |

---

## `executor`

```
type JobInput<T> = {
  id: string                      // idempotency key
  kind: string                    // matches handler name
  payload: T
  notBefore?: Timestamp
  maxAttempts?: number            // default 3
  backoff?: { kind: 'fixed' | 'exponential'; baseMs: number; maxMs?: number }
}

type JobContext = {
  attempt: number                 // 1-based
  signal: AbortSignal
  log: { info: (msg: string, meta?: object) => void; warn; error }
  clock: () => Timestamp
}

type Handler<T, R> = (payload: T, ctx: JobContext) => Promise<R>

type Queue = {
  push<T>(job: JobInput<T>): Promise<{ id: string }>
  pull(opts: { signal: AbortSignal }): Promise<{ id: string; kind: string; payload: unknown; attempt: number } | null>
  ack(id: string): Promise<void>
  nack(id: string, opts: { reason: string; retryAt?: Timestamp }): Promise<void>
  size(): Promise<number>
  close(): Promise<void>
}

type Executor = {
  register<T, R>(kind: string, handler: Handler<T, R>): void
  start(opts?: { concurrency?: number; signal?: AbortSignal }): Promise<void>
  stop(opts?: { drainMs?: number; signal?: AbortSignal }): Promise<void>
  enqueue<T>(job: JobInput<T>): Promise<{ id: string }>
}

function createExecutor(input: {
  queue: Queue
  clock?: () => Timestamp
  log?: (event: ExecutorEvent) => void
  metrics?: MetricsSink
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
