import type { ExecuteOptions, ExecutionResult } from '@cfxdevkit/executor';

export type BatchTask<T> = () => Promise<T> | T;

export interface TransactionBatcherOptions extends ExecuteOptions {
  stopOnFailure?: boolean;
}

export type TransactionBatchResult<T> = ExecutionResult<T>;
