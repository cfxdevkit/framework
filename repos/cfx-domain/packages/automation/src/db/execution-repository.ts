import { eq } from 'drizzle-orm';
import type { ExecutionRecord, ExecutionRepository, NewExecutionRecord } from '../repository.js';
import type { DrizzleAutomationDb } from './job-repository.js';
import { executions } from './schema.js';

interface ExecutionRow {
  id: number;
  jobId: string;
  txHash: `0x${string}`;
  timestamp: number;
  amountOut: string | null;
}

export interface DrizzleExecutionRepositoryOptions {
  clock?: () => number;
}

export class DrizzleExecutionRepository implements ExecutionRepository {
  readonly #db: DrizzleAutomationDb;
  readonly #clock: () => number;

  constructor(db: DrizzleAutomationDb, options: DrizzleExecutionRepositoryOptions = {}) {
    this.#db = db;
    this.#clock = options.clock ?? Date.now;
  }

  async create(input: NewExecutionRecord): Promise<ExecutionRecord> {
    const rows = await this.#db
      .insert(executions)
      .values({
        jobId: input.jobId,
        txHash: input.txHash,
        timestamp: input.timestamp ?? this.#clock(),
        amountOut: input.amountOut?.toString(),
      })
      .returning();
    return rowToRecord(rows[0] as unknown as ExecutionRow);
  }

  async listByJob(jobId: string): Promise<ExecutionRecord[]> {
    const rows = await this.#db
      .select()
      .from(executions)
      .where(eq(executions.jobId, jobId))
      .orderBy(executions.timestamp);
    return rows.map((row) => rowToRecord(row as unknown as ExecutionRow));
  }
}

function rowToRecord(row: ExecutionRow): ExecutionRecord {
  return {
    id: row.id,
    jobId: row.jobId,
    txHash: row.txHash,
    timestamp: row.timestamp,
    ...(row.amountOut !== null && row.amountOut !== undefined
      ? { amountOut: BigInt(row.amountOut) }
      : {}),
  };
}
