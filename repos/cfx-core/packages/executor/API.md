# `@cfxdevkit/executor` — Public API

> Generic background job runner with queues and scheduler.

## Sub-paths

| Sub-path | Exports |
|----------|---------|
| `.` | 16 symbols |

---

## `.`

```ts
export declare const __packageName: "@cfxdevkit/executor";
export interface ExecutionContext {
export interface RetryPolicy {
export interface ExecuteOptions extends RetryPolicy {
export interface BatchOptions extends ExecuteOptions {
export interface TaskQueueOptions extends BatchOptions {
export interface PollerContext {
export interface Poller {
export type ExecutionTask<T> = (context: ExecutionContext) => Promise<T> | T;
export type ExecutionResult<T> = {
export type PollerTask = (context: PollerContext) => Promise<void> | void;
export declare function execute<T>(task: ExecutionTask<T>, options?: ExecuteOptions): Promise<ExecutionResult<T>>;
export declare function executeBatch<T>(tasks: ReadonlyArray<ExecutionTask<T>>, options?: BatchOptions): Promise<Array<ExecutionResult<T>>>;
export declare function createTaskQueue(options?: TaskQueueOptions): {
export declare function createPoller(task: PollerTask, intervalMs: number): Poller;
export declare function withLock<T>(key: string, task: () => Promise<T> | T): Promise<T>;
```

<!-- api-hash: 5cec8a839e8a652ddce64cf27c05647b52df8e4be3afc66b5aaed94ccd64a113 -->
