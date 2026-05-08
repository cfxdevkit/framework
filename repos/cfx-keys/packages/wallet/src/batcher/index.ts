import { type ExecutionTask, executeBatch } from '@cfxdevkit/executor';
import type { BatchTask, TransactionBatcherOptions, TransactionBatchResult } from './types.js';

export type { BatchTask, TransactionBatcherOptions, TransactionBatchResult } from './types.js';

export class TransactionBatcher<T = unknown> {
  readonly #tasks: Array<BatchTask<T>> = [];
  readonly #options: TransactionBatcherOptions;

  constructor(options: TransactionBatcherOptions = {}) {
    this.#options = options;
  }

  add(task: BatchTask<T>): void {
    this.#tasks.push(task);
  }

  size(): number {
    return this.#tasks.length;
  }

  clear(): void {
    this.#tasks.splice(0, this.#tasks.length);
  }

  async execute(
    options: TransactionBatcherOptions = {},
  ): Promise<Array<TransactionBatchResult<T>>> {
    const tasks = this.#tasks.splice(0, this.#tasks.length);
    const executionTasks = tasks.map(
      (task): ExecutionTask<T> =>
        () =>
          task(),
    );
    const stopOnError = options.stopOnFailure ?? this.#options.stopOnFailure;
    return executeBatch(executionTasks, {
      ...this.#options,
      ...options,
      concurrency: 1,
      ...(stopOnError !== undefined ? { stopOnError } : {}),
    });
  }
}
