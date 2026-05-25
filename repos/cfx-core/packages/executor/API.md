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
// Package name identifier for runtime introspection.
export declare const __packageName: "@cfxdevkit/executor";

// Metadata and runtime information for the current task execution.
export interface ExecutionContext {
  // Unique ID for this execution instance.
  id: string;
  // Timestamp when the execution started.
  startTime: number;
  // Optional labels attached to the task.
  labels?: Record<string, string>;
  // Reference to the queue if executed within a queue context.
  queueName?: string;
}

// Defines how many times a failed task should be retried and the delay between retries.
export interface RetryPolicy {
  // Maximum number of retry attempts after initial failure.
  maxRetries: number;
  // Base delay in milliseconds between retries (applied with exponential backoff).
  baseDelayMs: number;
}

// Options such as timeout, labels, and retry behavior for a single task.
export interface ExecuteOptions extends RetryPolicy {
  // Maximum duration in milliseconds before the task is considered timed out.
  timeoutMs?: number;
  // Arbitrary key-value metadata to attach to the task for tracing/debugging.
  labels?: Record<string, string>;
}

// Options inherited from ExecuteOptions, plus batch-specific settings like concurrency.
export interface BatchOptions extends ExecuteOptions {
  // Maximum number of tasks allowed to run concurrently in the batch.
  concurrency?: number;
}

// Queue-specific settings including concurrency, priority, and persistence.
export interface TaskQueueOptions extends BatchOptions {
  // Name of the queue for identification and logging.
  name?: string;
  // Whether to persist queue state (e.g., to disk or remote store).
  persistent?: boolean;
  // Optional priority function to reorder pending tasks.
  priorityFn?: (a: ExecutionTask<any>, b: ExecutionTask<any>) => number;
}

// Runtime context for periodic tasks, including last execution time and metadata.
export interface PollerContext {
  // Timestamp of the last successful execution (0 if none yet).
  lastExecutionTime: number;
  // Number of consecutive failures since last success.
  failureCount: number;
  // Optional metadata passed at poller creation.
  metadata?: Record<string, unknown>;
}

// Interface representing a running poller instance with start/stop capabilities.
export interface Poller {
  // Start the poller and begin executing the task at the specified interval.
  start(): void;
  // Stop the poller and cancel any pending executions.
  stop(): void;
  // Whether the poller is currently running.
  isRunning(): boolean;
}

// A function that performs a unit of work and receives execution context.
export type ExecutionTask<T> = (context: ExecutionContext) => Promise<T> | T;

// Contains the result value, status (success/failure), and optional error details.
export type ExecutionResult<T> = {
  // The value returned by the task on success.
  value?: T;
  // Whether the execution succeeded.
  success: boolean;
  // Error object if the execution failed.
  error?: Error;
};

// A function that performs a periodic background task and receives poller context.
export type PollerTask = (context: PollerContext) => Promise<void> | void;

// Executes a single task with the provided options.
export declare function execute<T>(task: ExecutionTask<T>, options?: ExecuteOptions): Promise<ExecutionResult<T>>;

// Executes a collection of tasks in a batch.
export declare function executeBatch<T>(tasks: ReadonlyArray<ExecutionTask<T>>, options?: BatchOptions): Promise<Array<ExecutionResult<T>>>;

// Initializes a new task queue.
export declare function createTaskQueue(options?: TaskQueueOptions): {
  // Enqueue a task to be processed by the queue.
  enqueue<T>(task: ExecutionTask<T>, options?: ExecuteOptions): void;
  // Start processing tasks from the queue.
  start(): void;
  // Stop processing tasks and wait for in-flight tasks to finish.
  stop(): Promise<void>;
  // Number of tasks currently pending in the queue.
  pendingCount(): number;
  // Number of tasks currently being processed.
  activeCount(): number;
};

// Initializes a new poller for periodic tasks.
export declare function createPoller(task: PollerTask, intervalMs: number): Poller;

// Executes a task within a distributed lock.
export declare function withLock<T>(key: string, task: () => Promise<T> | T): Promise<T>;
```

<!-- api-hash: 5cec8a839e8a652ddce64cf27c05647b52df8e4be3afc66b5aaed94ccd64a113 -->
