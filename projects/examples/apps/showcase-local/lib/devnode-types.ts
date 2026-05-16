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

export interface DevnodeProfileSummary {
  id: string;
  name: string;
  dataDir: string;
  selected: boolean;
  locked: boolean;
  accountCount: number;
  firstAddress?: string;
}

export interface DevnodeProfileStateResponse {
  ok: boolean;
  error?: string;
  locked: boolean;
  profiles: DevnodeProfileSummary[];
  selectedProfile: DevnodeProfileSummary | null;
}

export interface DevnodeProfileSelectionResponse {
  ok: boolean;
  error?: string;
  profile?: DevnodeProfileSummary;
}

export interface DevnodeMineRequest {
  count?: number;
}
