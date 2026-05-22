# `@cfxdevkit/executor` — Public API

> Generic background job runner with queues and scheduler.

## Sub-paths

| Sub-path | Exports |
|----------|---------|
| `.` | 16 symbols |

---

## `.`

### Usage

```ts
import { execute, executeBatch, createTaskQueue } from '@cfxdevkit/executor';

const task = async (ctx) => {
  return "success";
};

const result = await execute(task);
const batchResults = await executeBatch([task, task]);
```

```ts
// The name of the package.
export declare const __packageName: "@cfxdevkit/executor";

// Context provided to an execution task.
export interface ExecutionContext {
  // Metadata and runtime information for the current task execution.
}

// Configuration for task retry logic.
export interface RetryPolicy {
  // Defines how many times a failed task should be retried and the delay between retries.
}

// Configuration options for executing a single task.
export interface ExecuteOptions extends RetryPolicy {
  // Options such as timeout, labels, and retry behavior for a single task.
}

// Configuration options for executing a batch of tasks.
export interface BatchOptions extends ExecuteOptions {
  // Options inherited from ExecuteOptions, plus batch-specific settings like concurrency.
}

// Configuration options for creating a task queue.
export interface TaskQueueOptions extends BatchOptions {
  // Queue-specific settings including concurrency, priority, and persistence.
}

// Context provided to a poller task.
export interface PollerContext {
  // Runtime context for periodic tasks, including last execution time and metadata.
}

// A scheduler that runs tasks at regular intervals.
export interface Poller {
  // Interface representing a running poller instance with start/stop capabilities.
}

// A function that performs a unit of work.
export type ExecutionTask<T> = (context: ExecutionContext) => Promise<T> | T;

// The outcome of a task execution.
export type ExecutionResult<T> = {
  // Contains the result value, status (success/failure), and optional error details.
};

// A function that performs periodic work.
export type PollerTask = (context: PollerContext) => Promise<void> | void;

// Executes a single task with the provided options.
export declare function execute<T>(task: ExecutionTask<T>, options?: ExecuteOptions): Promise<ExecutionResult<T>>;

// Executes a collection of tasks in a batch.
export declare function executeBatch<T>(tasks: ReadonlyArray<ExecutionTask<T>>, options?: BatchOptions): Promise<Array<ExecutionResult<T>>>;

// Initializes a new task queue.
export declare function createTaskQueue(options?: TaskQueueOptions): {
  // Returns a queue instance with methods to enqueue tasks and start/stop processing.
};

// Initializes a new poller for periodic tasks.
export declare function createPoller(task: PollerTask, intervalMs: number): Poller;

// Executes a task within a distributed lock.
export declare function withLock<T>(key: string, task: () => Promise<T> | T): Promise<T>;
```

<!-- api-hash: 5cec8a839e8a652ddce64cf27c05647b52df8e4be3afc66b5aaed94ccd64a113 -->
