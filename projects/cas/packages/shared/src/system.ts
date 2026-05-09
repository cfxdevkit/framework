import type { CasHexAddress } from './jobs.js';

export type CasNetwork = 'testnet' | 'mainnet';
export type CasWorkerStatus = 'active' | 'idle' | 'unknown';

export interface CasSystemStatusResponse {
  ts: string;
  network: CasNetwork;
  backend: {
    ok: boolean;
    uptimeSeconds: number;
    uptimeHuman: string;
  };
  database: {
    ok: boolean;
    jobCount: number;
    executionCount: number;
    pending: number;
    active: number;
    failed: number;
    lastExecutionAt: number | null;
    workerLastSeenAt: number | null;
  };
  rpc: {
    ok: boolean;
    url: string;
    blockNumber?: string;
    latencyMs?: number;
    error?: string;
  };
  contracts: {
    automationManager: CasContractHealth;
    priceAdapter: CasContractHealth;
    permitHandler: CasContractHealth;
  };
  worker: {
    status: CasWorkerStatus;
    lastSeenAt: number | null;
    lastExecutionAt: number | null;
  };
  paused: boolean;
  checkedInMs: number;
}

export interface CasContractHealth {
  ok: boolean;
  address: CasHexAddress;
  error?: string;
}
