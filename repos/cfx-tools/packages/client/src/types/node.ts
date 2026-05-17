import type { AccountInfo } from './common.js';

/** Mining status. */
export interface MiningStatus {
  enabled: boolean;
  intervalMs: number;
  ticks: number;
  startedAt?: string | Date;
}

/** Node status response from `/node/status`. */
export interface NodeStatus {
  status: string;
  running: boolean;
  mining?: MiningStatus;
  urls?: {
    core: string;
    espace: string;
    coreWs: string;
    espaceWs: string;
  };
  faucet?: AccountInfo;
  accounts: AccountInfo[];
}
