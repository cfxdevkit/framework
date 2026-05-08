import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const jobs = sqliteTable('jobs', {
  id: text('id').primaryKey(),
  owner: text('owner').notNull(),
  type: text('type', { enum: ['limit_order', 'dca', 'twap', 'swap'] }).notNull(),
  status: text('status', {
    enum: ['pending', 'active', 'executed', 'cancelled', 'failed', 'expired', 'paused'],
  })
    .notNull()
    .default('pending'),
  paramsJson: text('params_json').notNull(),
  onChainJobId: text('on_chain_job_id'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
  expiresAt: integer('expires_at'),
  retries: integer('retries').notNull().default(0),
  maxRetries: integer('max_retries').notNull().default(5),
  lastError: text('last_error'),
  txHash: text('tx_hash'),
});

export const executions = sqliteTable('executions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  jobId: text('job_id')
    .notNull()
    .references(() => jobs.id),
  txHash: text('tx_hash').notNull(),
  timestamp: integer('timestamp').notNull(),
  amountOut: text('amount_out'),
});

export const workerHeartbeat = sqliteTable('worker_heartbeat', {
  id: integer('id').primaryKey(),
  lastSeenAt: integer('last_seen_at').notNull(),
  workerPid: integer('worker_pid'),
});

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});
