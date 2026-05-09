import cors from 'cors';
import express, { type Express } from 'express';
import { type CasBackendConfig, resolveCasBackendConfig } from './config.js';
import { createCasSqliteRuntime } from './db/sqlite.js';
import { createAdminRouter } from './routes/admin.js';
import { createAuthRouter } from './routes/auth.js';
import { createHealthRouter } from './routes/health.js';
import { createJobsRouter } from './routes/jobs.js';
import { createPoolsRouter } from './routes/pools.js';
import { createSseRouter } from './routes/sse.js';
import { createSystemRouter } from './routes/system.js';
import type { CasBackendState } from './types.js';

export interface CreateCasBackendAppOptions {
  config?: CasBackendConfig;
  state?: CasBackendState;
}

export interface CasBackendApp {
  app: Express;
  state: CasBackendState;
}

export function createCasBackendState(config = resolveCasBackendConfig()): CasBackendState {
  return {
    config,
    db: createCasSqliteRuntime(config.sqlitePath, { ttlMs: config.nonceTtlMs }),
  };
}

export function createCasBackendApp(options: CreateCasBackendAppOptions = {}): CasBackendApp {
  const config = options.config ?? resolveCasBackendConfig();
  const state = options.state ?? createCasBackendState(config);
  const app = express();

  app.use(cors(config.corsOrigins.length > 0 ? { origin: config.corsOrigins } : undefined));
  app.use(express.json());
  app.use('/health', createHealthRouter(state));
  app.use('/auth', createAuthRouter(state));
  app.use('/jobs', createJobsRouter(state));
  app.use('/admin', createAdminRouter(state));
  app.use('/pools', createPoolsRouter(state));
  app.use('/sse', createSseRouter(state));
  app.use('/system', createSystemRouter(state));

  return { app, state };
}
