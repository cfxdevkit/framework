import type { HttpClient } from './http.js';
import type {
  CompileArtifact,
  DeployRunResponse,
  NetworkCapabilitiesResponse,
  NetworkConfigResponse,
  NetworkProfileResponse,
  SessionKeyIssueResponse,
  SessionKeyVerifyResponse,
  Space,
} from './types.js';

export interface CompilerNamespace {
  compileSources(input: {
    contractName: string;
    filename?: string;
    solcVersion?: string;
    source: string;
  }): Promise<CompileArtifact & { ok: boolean }>;
}

export function createCompilerNamespace(http: HttpClient): CompilerNamespace {
  return {
    compileSources: (input) => http.post('/compiler/sources', input),
  };
}

export interface SessionKeysNamespace {
  issue(input: {
    capability?: {
      chains?: number[];
      contracts?: string[];
      maxValuePerTx?: string;
      notAfter?: number;
      selectors?: string[];
    };
  }): Promise<SessionKeyIssueResponse>;
  verify(input: {
    capability?: {
      chains?: number[];
      contracts?: string[];
      maxValuePerTx?: string;
      notAfter?: number;
      selectors?: string[];
    };
    parent: string;
    session: string;
    signature: string;
  }): Promise<SessionKeyVerifyResponse>;
}

export function createSessionKeysNamespace(http: HttpClient): SessionKeysNamespace {
  return {
    issue: (input) => http.post('/session-key/issue', input),
    verify: (input) => http.post('/session-key/verify', input),
  };
}

export interface DeployNamespace {
  run(input: {
    accountIndex?: number;
    abi: unknown[];
    args?: unknown[];
    bytecode: string;
    contractName?: string;
    network?: 'local' | 'testnet' | 'mainnet';
    privateKey?: string;
    space?: Space;
  }): Promise<DeployRunResponse>;
}

export function createDeployNamespace(http: HttpClient): DeployNamespace {
  return {
    run: (input) => http.post('/deploy/run', input),
  };
}

export interface NetworkNamespace {
  current(): Promise<NetworkProfileResponse>;
  capabilities(): Promise<NetworkCapabilitiesResponse>;
  config(): Promise<NetworkConfigResponse>;
  setConfig(
    key: 'espaceRpc' | 'coreRpc' | 'espaceChainId' | 'coreChainId',
    value: string | number,
  ): Promise<NetworkConfigResponse>;
  set(network: 'local' | 'testnet' | 'mainnet'): Promise<NetworkProfileResponse>;
}

export function createNetworkNamespace(http: HttpClient): NetworkNamespace {
  return {
    current: () => http.get('/network/current'),
    capabilities: () => http.get('/network/capabilities'),
    config: () => http.get('/network/config'),
    setConfig: (key, value) => http.post('/network/config', { key, value }),
    set: (network) => http.post('/network/set', { network }),
  };
}

export interface MiningNamespace {
  status(): Promise<{ ok: boolean; running: boolean; intervalMs: number | null }>;
  start(input?: { intervalMs?: number }): Promise<{
    ok: boolean;
    running: boolean;
    intervalMs: number | null;
  }>;
  stop(): Promise<{ ok: boolean; running: boolean; intervalMs: number | null }>;
}

export function createMiningNamespace(http: HttpClient): MiningNamespace {
  return {
    status: () => http.get('/mining/status'),
    start: (input?) => http.post('/mining/start', input ?? {}),
    stop: () => http.post('/mining/stop'),
  };
}
