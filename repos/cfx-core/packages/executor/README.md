# @cfxdevkit/executor

**Scope:** Generic execution primitives for keeper / off-chain automation systems.

**Responsibilities**
- Job queue interface (pluggable backends via `createTaskQueue`)
- Retry with exponential backoff policies (via `RetryPolicy` and `ExecuteOptions`)
- Gas-aware transaction submission (via `gasPrice`, `maxFeePerGas`, `maxPriorityFeePerGas` in `ExecutionContext`)
- Idempotency support (via `idempotencyKey` in `ExecuteOptions`)
- Distributed locking (via `withLock`)
- Periodic polling (via `createPoller`)

Domain-specific automation strategies (DCA, limit orders, etc.) live in
`@cfxdevkit/automation` and consume this package.

## Installation

```bash
npm install @cfxdevkit/executor
```

## Sub-paths

| Sub-path | Exports |
|----------|---------|
| `.` | 16 symbols |

---

## `.`

### Types

```ts
export interface ExecutionContext {
  chainId: number;
  blockNumber: number;
  timestamp: number;
  gasPrice?: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
}

export interface RetryPolicy {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

export interface ExecuteOptions extends RetryPolicy {
  idempotencyKey?: string;
  context?: Partial<ExecutionContext>;
}

export interface BatchOptions extends ExecuteOptions {}

export interface TaskQueueOptions extends BatchOptions {
  concurrency?: number;
}

export interface PollerContext {
  chainId: number;
  blockNumber: number;
  timestamp: number;
}

export type ExecutionTask<T> = (context: ExecutionContext) => Promise<T> | T;

export type ExecutionResult<T> = {
  success: boolean;
  value?: T;
  error?: Error;
  attempts: number;
};

export type PollerTask = (context: PollerContext) => Promise<void> | void;

export interface Poller {
  start(): void;
  stop(): void;
  isRunning: boolean;
}
```

### Functions

```ts
export declare function execute<T>(
  task: ExecutionTask<T>,
  options?: ExecuteOptions
): Promise<ExecutionResult<T>>;

export declare function executeBatch<T>(
  tasks: ReadonlyArray<ExecutionTask<T>>,
  options?: BatchOptions
): Promise<Array<ExecutionResult<T>>>;

export declare function createTaskQueue(
  options?: TaskQueueOptions
): {
  enqueue<T>(task: ExecutionTask<T>, options?: ExecuteOptions): Promise<ExecutionResult<T>>;
  start(): void;
  stop(): void;
  isRunning: boolean;
};

export declare function createPoller(
  task: PollerTask,
  intervalMs: number
): Poller;

export declare function withLock<T>(
  key: string,
  task: () => Promise<T> | T
): Promise<T>;
```

### Usage

#### Single execution with retry and idempotency

```ts
import { execute } from '@cfxdevkit/executor';

const result = await execute(
  async (ctx) => {
    // Perform on-chain operation using ctx.gasPrice, etc.
    return 'success';
  },
  {
    maxAttempts: 3,
    initialDelayMs: 500,
    maxDelayMs: 5000,
    backoffMultiplier: 2,
    idempotencyKey: 'tx-0x123',
    context: { chainId: 1, blockNumber: 18000000 }
  }
);
```

#### Batch execution

```ts
import { executeBatch } from '@cfxdevkit/executor';

const results = await executeBatch(
  [
    async (ctx) => task1(ctx),
    async (ctx) => task2(ctx),
  ],
  { maxAttempts: 2, context: { chainId: 1 } }
);
```

#### Task queue with concurrency control

```ts
import { createTaskQueue } from '@cfxdevkit/executor';

const queue = createTaskQueue({
  concurrency: 5,
  maxAttempts: 3,
  initialDelayMs: 250
});

queue.start();

await queue.enqueue(async (ctx) => {
  // Enqueued task
});

// Later...
queue.stop();
```

#### Poller for periodic checks

```ts
import { createPoller } from '@cfxdevkit/executor';

const poller = createPoller(
  async (ctx) => {
    // Check condition every 10s
  },
  10_000
);

poller.start();
// poller.stop();
```

#### Distributed locking

```ts
import { withLock } from '@cfxdevkit/executor';

const result = await withLock('dca:account-0x...', async () => {
  // Critical section — only one instance runs at a time
});
```

## API Reference

See [API.md](./API.md) for the full public surface.

## Tier

**Tier 0 — framework** — Must not runtime-import from any higher tier.

<!-- readme-hash: 9aa02bad92520ac79abe0083f7fcc7e655b19779bd6edf6b99a1826d75a3a2f8 -->
