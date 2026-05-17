// Profile types — canonical source is @cfxdevkit/client
export type {
  NodeProfileSelection as DevnodeProfileSelectionResponse,
  NodeProfileState as DevnodeProfileStateResponse,
  NodeProfileSummary as DevnodeProfileSummary,
} from '@cfxdevkit/client';

// These types differ structurally from @cfxdevkit/client NodeStatus and are
// local adapters for showcase-local's own devnode instance API routes.
export interface DevnodeUrls {
  core: string;
  espace: string;
  coreWs: string;
  espaceWs: string;
}

export interface DevnodeAccountSummary {
  index: number;
  evmAddress: string;
  coreAddress: string;
  initialBalanceCfx: string;
}

export interface DevnodeAccountsResponse {
  ok: boolean;
  accounts: DevnodeAccountSummary[];
  faucet?: DevnodeAccountSummary;
  error?: string;
}

export interface DevnodeMiningStatus {
  enabled: boolean;
  intervalMs: number;
  ticks: number;
  startedAt?: string;
}

export interface DevnodeStatusResponse {
  status: 'stopped' | 'starting' | 'running' | 'stopping' | 'error';
  running: boolean;
  blockNumber?: number;
  error?: string;
  mining?: DevnodeMiningStatus;
  rpcUrl?: string;
  urls?: DevnodeUrls;
}

export interface DevnodeMineRequest {
  count?: number;
}
