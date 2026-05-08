import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import type { Database as BetterSqliteDatabase } from 'better-sqlite3';
import Database from 'better-sqlite3';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema.js';

export interface AutomationSqlite {
  db: BetterSQLite3Database<typeof schema>;
  sqlite: BetterSqliteDatabase;
}

export function createSqliteDb(path = ':memory:'): AutomationSqlite {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
  const sqlite = new Database(path);
  sqlite.pragma('journal_mode = WAL');
  initializeSqliteSchema(sqlite);
  const db = drizzle(sqlite, { schema });
  return { db, sqlite };
}

export function initializeSqliteSchema(sqlite: Database.Database): void {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY NOT NULL,
      owner TEXT NOT NULL,
      type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      params_json TEXT NOT NULL,
      on_chain_job_id TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      expires_at INTEGER,
      retries INTEGER NOT NULL DEFAULT 0,
      max_retries INTEGER NOT NULL DEFAULT 5,
      last_error TEXT,
      tx_hash TEXT
    );

    CREATE TABLE IF NOT EXISTS executions (
      id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      job_id TEXT NOT NULL REFERENCES jobs(id),
      tx_hash TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      amount_out TEXT
    );

    CREATE TABLE IF NOT EXISTS worker_heartbeat (
      id INTEGER PRIMARY KEY NOT NULL,
      last_seen_at INTEGER NOT NULL,
      worker_pid INTEGER
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
  `);
}
