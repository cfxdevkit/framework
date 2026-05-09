import {
  type AutomationSqlite,
  createSqliteDb,
  DrizzleExecutionRepository,
  DrizzleJobRepository,
} from '@cfxdevkit/automation/db';
import { generateSiweNonce } from '@cfxdevkit/wallet-connect/siwe';

export interface SqliteNonceStoreOptions {
  ttlMs?: number;
  now?: () => number;
}

export interface CasSqliteRuntime extends AutomationSqlite {
  dbPath: string;
  jobs: DrizzleJobRepository;
  executions: DrizzleExecutionRepository;
  nonces: SqliteNonceStore;
  settings: SqliteSettingsStore;
  heartbeat: SqliteWorkerHeartbeatStore;
}

const DEFAULT_NONCE_TTL_MS = 5 * 60 * 1000;

type SqliteHandle = AutomationSqlite['sqlite'];
type JobRepositoryDb = ConstructorParameters<typeof DrizzleJobRepository>[0];
type ExecutionRepositoryDb = ConstructorParameters<typeof DrizzleExecutionRepository>[0];

export class SqliteNonceStore {
  readonly #sqlite: SqliteHandle;
  readonly #ttlMs: number;
  readonly #now: () => number;

  constructor(sqlite: SqliteHandle, options: SqliteNonceStoreOptions = {}) {
    this.#sqlite = sqlite;
    this.#ttlMs = options.ttlMs ?? DEFAULT_NONCE_TTL_MS;
    this.#now = options.now ?? Date.now;
  }

  issue(address: string): string {
    this.sweepExpired();
    const nonce = generateSiweNonce();
    this.#sqlite
      .prepare(`INSERT INTO auth_nonces (nonce, address, expires_at, used) VALUES (?, ?, ?, 0)`)
      .run(nonce, address.toLowerCase(), this.#now() + this.#ttlMs);
    return nonce;
  }

  consume(nonce: string, address: string): boolean {
    const row = this.#sqlite
      .prepare(
        `SELECT nonce, address, expires_at AS expiresAt, used FROM auth_nonces WHERE nonce = ?`,
      )
      .get(nonce) as
      | { nonce: string; address: string; expiresAt: number; used: number }
      | undefined;

    if (!row) return false;
    if (row.used) return false;
    if (row.expiresAt < this.#now()) {
      this.#sqlite.prepare(`DELETE FROM auth_nonces WHERE nonce = ?`).run(nonce);
      return false;
    }
    if (row.address !== address.toLowerCase()) return false;

    this.#sqlite.prepare(`UPDATE auth_nonces SET used = 1 WHERE nonce = ?`).run(nonce);
    return true;
  }

  clear(): void {
    this.#sqlite.prepare(`DELETE FROM auth_nonces`).run();
  }

  private sweepExpired(): void {
    this.#sqlite.prepare(`DELETE FROM auth_nonces WHERE expires_at < ?`).run(this.#now());
  }
}

export class SqliteSettingsStore {
  readonly #sqlite: SqliteHandle;

  constructor(sqlite: SqliteHandle) {
    this.#sqlite = sqlite;
  }

  get(key: string): string | null {
    const row = this.#sqlite.prepare(`SELECT value FROM settings WHERE key = ?`).get(key) as
      | { value: string }
      | undefined;
    return row?.value ?? null;
  }

  set(key: string, value: string): void {
    this.#sqlite
      .prepare(
        `INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      )
      .run(key, value);
  }

  isPaused(): boolean {
    return this.get('paused') === 'true';
  }

  pause(): boolean {
    this.set('paused', 'true');
    return true;
  }

  resume(): boolean {
    this.set('paused', 'false');
    return false;
  }
}

export interface WorkerHeartbeatSnapshot {
  lastSeenAt: number;
  workerPid?: number;
}

export class SqliteWorkerHeartbeatStore {
  readonly #sqlite: SqliteHandle;

  constructor(sqlite: SqliteHandle) {
    this.#sqlite = sqlite;
  }

  get(): WorkerHeartbeatSnapshot | null {
    const row = this.#sqlite
      .prepare(
        `SELECT last_seen_at AS lastSeenAt, worker_pid AS workerPid FROM worker_heartbeat WHERE id = 1`,
      )
      .get() as { lastSeenAt: number; workerPid: number | null } | undefined;
    if (!row) return null;
    return {
      lastSeenAt: row.lastSeenAt,
      ...(row.workerPid !== null && row.workerPid !== undefined
        ? { workerPid: row.workerPid }
        : {}),
    };
  }

  update(snapshot: WorkerHeartbeatSnapshot): void {
    this.#sqlite
      .prepare(
        `INSERT INTO worker_heartbeat (id, last_seen_at, worker_pid)
           VALUES (1, ?, ?)
           ON CONFLICT(id) DO UPDATE SET
             last_seen_at = excluded.last_seen_at,
             worker_pid = excluded.worker_pid`,
      )
      .run(snapshot.lastSeenAt, snapshot.workerPid ?? null);
  }
}

function initializeCasSqliteSchema(sqlite: SqliteHandle): void {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS auth_nonces (
      nonce TEXT PRIMARY KEY NOT NULL,
      address TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      used INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS worker_heartbeat (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      last_seen_at INTEGER NOT NULL,
      worker_pid INTEGER
    );
  `);
}

export function createCasSqliteRuntime(
  dbPath: string,
  options: SqliteNonceStoreOptions = {},
): CasSqliteRuntime {
  const runtime = createSqliteDb(dbPath);
  initializeCasSqliteSchema(runtime.sqlite);
  return {
    ...runtime,
    dbPath,
    jobs: new DrizzleJobRepository(runtime.db as unknown as JobRepositoryDb),
    executions: new DrizzleExecutionRepository(runtime.db as unknown as ExecutionRepositoryDb),
    nonces: new SqliteNonceStore(runtime.sqlite, options),
    settings: new SqliteSettingsStore(runtime.sqlite),
    heartbeat: new SqliteWorkerHeartbeatStore(runtime.sqlite),
  };
}
