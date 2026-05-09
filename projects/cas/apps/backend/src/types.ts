import type { CasBackendConfig } from './config.js';
import type { CasSqliteRuntime } from './db/sqlite.js';

export interface CasBackendState {
  config: CasBackendConfig;
  db: CasSqliteRuntime;
}
