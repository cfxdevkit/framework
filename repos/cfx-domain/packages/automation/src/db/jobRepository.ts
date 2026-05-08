import { randomUUID } from 'node:crypto';
import { and, desc, eq, gte, inArray } from 'drizzle-orm';
import type { JobListFilter, JobRepository, JobUpdate, NewJobInput } from '../repository.js';
import type { ExecuteResult, Job, JobStatus, JobType } from '../types.js';
import { jobs } from './schema.js';
import { jobToRow, resultToUpdate, rowToJob, serializeParams } from './serialization.js';

interface QueryChain<TResult> extends PromiseLike<TResult[]> {
  from(table: unknown): QueryChain<TResult>;
  where(condition: unknown): QueryChain<TResult>;
  orderBy(...columns: unknown[]): QueryChain<TResult>;
  limit(count: number): QueryChain<TResult>;
  set(values: unknown): QueryChain<TResult>;
  values(values: unknown): QueryChain<TResult>;
  returning(): Promise<TResult[]>;
}

export interface DrizzleAutomationDb {
  select(): QueryChain<ReturnType<typeof jobToRow>>;
  insert(table: unknown): QueryChain<ReturnType<typeof jobToRow>>;
  update(table: unknown): QueryChain<ReturnType<typeof jobToRow>>;
}

export interface DrizzleJobRepositoryOptions {
  clock?: () => number;
}

export class DrizzleJobRepository implements JobRepository {
  readonly #db: DrizzleAutomationDb;
  readonly #clock: () => number;

  constructor(db: DrizzleAutomationDb, options: DrizzleJobRepositoryOptions = {}) {
    this.#db = db;
    this.#clock = options.clock ?? Date.now;
  }

  async create(input: NewJobInput): Promise<Job> {
    const now = this.#clock();
    const job = {
      ...input,
      id: input.id ?? randomUUID(),
      status: input.status ?? 'pending',
      createdAt: input.createdAt ?? now,
      updatedAt: input.updatedAt ?? now,
      retries: input.retries ?? 0,
    } as Job;
    await this.#db.insert(jobs).values(jobToRow(job));
    return rowToJob(jobToRow(job));
  }

  async get(id: string): Promise<Job | undefined> {
    const rows = await this.#db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
    return rows[0] ? rowToJob(rows[0]) : undefined;
  }

  async list(filter: JobListFilter = {}): Promise<Job[]> {
    const where = buildFilter(filter);
    const query = this.#db.select().from(jobs).orderBy(desc(jobs.updatedAt));
    const rows = where ? await query.where(where) : await query;
    return rows.map(rowToJob);
  }

  async update(id: string, update: JobUpdate): Promise<Job | undefined> {
    const patch = rowPatch(update, this.#clock());
    const rows = await this.#db.update(jobs).set(patch).where(eq(jobs.id, id)).returning();
    return rows[0] ? rowToJob(rows[0]) : undefined;
  }

  async markActive(id: string, onChainJobId?: Job['onChainJobId']): Promise<Job | undefined> {
    return this.update(
      id,
      onChainJobId ? { status: 'active', onChainJobId } : { status: 'active' },
    );
  }

  async markExecuted(id: string, result: ExecuteResult): Promise<Job | undefined> {
    return this.update(id, resultToUpdate(result));
  }

  async markFailed(id: string, error: string): Promise<Job | undefined> {
    return this.update(id, { status: 'failed', lastError: error });
  }

  async incrementRetry(id: string, error?: string): Promise<Job | undefined> {
    const existing = await this.get(id);
    if (!existing) return undefined;
    return this.update(
      id,
      error
        ? { retries: existing.retries + 1, lastError: error }
        : { retries: existing.retries + 1 },
    );
  }

  async cancel(id: string, owner?: string): Promise<Job | undefined | 'forbidden'> {
    const existing = await this.get(id);
    if (!existing) return undefined;
    if (owner && existing.owner.toLowerCase() !== owner.toLowerCase()) return 'forbidden';
    if (!['pending', 'active', 'failed', 'paused'].includes(existing.status)) return undefined;
    return this.update(id, { status: 'cancelled' });
  }

  async getUpdatedSince(timestampMs: number): Promise<Job[]> {
    const rows = await this.#db
      .select()
      .from(jobs)
      .where(gte(jobs.updatedAt, timestampMs))
      .orderBy(jobs.updatedAt);
    return rows.map(rowToJob);
  }
}

function buildFilter(filter: JobListFilter) {
  const clauses = [];
  if (filter.owner !== undefined) clauses.push(eq(jobs.owner, filter.owner));
  if (filter.status !== undefined) clauses.push(matchesStatus(filter.status));
  if (filter.type !== undefined) clauses.push(matchesType(filter.type));
  if (clauses.length === 0) return undefined;
  return clauses.length === 1 ? clauses[0] : and(...clauses);
}

function matchesStatus(value: NonNullable<JobListFilter['status']>) {
  if (Array.isArray(value)) return inArray(jobs.status, [...value]);
  return eq(jobs.status, value as JobStatus);
}

function matchesType(value: NonNullable<JobListFilter['type']>) {
  if (Array.isArray(value)) return inArray(jobs.type, [...value]);
  return eq(jobs.type, value as JobType);
}

function rowPatch(update: JobUpdate, now: number) {
  return {
    ...(update.status !== undefined ? { status: update.status } : {}),
    ...(update.retries !== undefined ? { retries: update.retries } : {}),
    ...(update.maxRetries !== undefined ? { maxRetries: update.maxRetries } : {}),
    ...(update.onChainJobId !== undefined ? { onChainJobId: update.onChainJobId } : {}),
    ...(update.expiresAt !== undefined ? { expiresAt: update.expiresAt } : {}),
    ...(update.lastError !== undefined ? { lastError: update.lastError } : {}),
    ...(update.txHash !== undefined ? { txHash: update.txHash } : {}),
    ...(update.params !== undefined ? { paramsJson: serializeParams(update.params) } : {}),
    updatedAt: update.updatedAt ?? now,
  };
}
