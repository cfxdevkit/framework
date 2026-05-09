import type { HttpClient } from './http.js';
import type { NodeStatus, OkResponse } from './types.js';

export interface NodeStartInput {
  config?: Record<string, unknown>;
}

export interface NodeRestartInput {
  config?: Record<string, unknown>;
}

export interface NodeWipeInput {
  restart?: boolean;
  config?: Record<string, unknown>;
}

export interface NodeMineInput {
  blocks?: number;
  pack?: boolean;
}

export interface NodeNamespace {
  status(): Promise<{ ok: boolean; node: NodeStatus }>;
  start(input?: NodeStartInput): Promise<{ ok: boolean; node: NodeStatus }>;
  stop(): Promise<{ ok: boolean; node: NodeStatus }>;
  restart(input?: NodeRestartInput): Promise<{ ok: boolean; node: NodeStatus }>;
  wipe(input?: NodeWipeInput): Promise<{ ok: boolean; node: NodeStatus }>;
  mine(input?: NodeMineInput): Promise<{ ok: boolean; node: NodeStatus }>;
}

export function createNodeNamespace(http: HttpClient): NodeNamespace {
  return {
    status: () => http.get('/node/status'),
    start: (input?) => http.post('/node/start', input ?? {}),
    stop: () => http.post('/node/stop'),
    restart: (input?) => http.post('/node/restart', input ?? {}),
    wipe: (input?) => http.post('/node/wipe', input ?? {}),
    mine: (input?) => http.post('/node/mine', input ?? {}),
  };
}

export interface KeystoreNamespace {
  status(): Promise<{
    ok: boolean;
    locked: boolean;
    initialized: boolean;
    walletCount: number;
  }>;
  setup(input: { passphrase: string }): Promise<{ ok: boolean; walletCount: number }>;
  unlock(input: { passphrase: string }): Promise<OkResponse>;
  lock(): Promise<OkResponse>;
  wallets: {
    list(): Promise<{
      ok: boolean;
      wallets: Array<{ id: string; name: string; active: boolean }>;
    }>;
    add(input: {
      mnemonic: string;
      name: string;
    }): Promise<{ ok: boolean; wallet: { id: string; name: string; active: boolean } }>;
    activate(id: string): Promise<OkResponse>;
    delete(id: string): Promise<OkResponse>;
    rename(id: string, name: string): Promise<OkResponse>;
  };
}

export function createKeystoreNamespace(http: HttpClient): KeystoreNamespace {
  return {
    status: () => http.get('/keystore/status'),
    setup: (input) => http.post('/keystore/setup', input),
    unlock: (input) => http.post('/keystore/unlock', input),
    lock: () => http.post('/keystore/lock'),
    wallets: {
      list: () => http.get('/keystore/wallets'),
      add: (input) => http.post('/keystore/wallets', input),
      activate: (id) => http.put(`/keystore/wallets/${encodeURIComponent(id)}/activate`),
      delete: (id) => http.delete(`/keystore/wallets/${encodeURIComponent(id)}`),
      rename: (id, name) =>
        http.patch(`/keystore/wallets/${encodeURIComponent(id)}/rename`, { name }),
    },
  };
}

export interface AccountsNamespace {
  list(): Promise<{
    ok: boolean;
    accounts: Array<{
      index: number;
      evmAddress: string;
      coreAddress: string;
      initialBalanceCfx: number;
    }>;
  }>;
  faucet(): Promise<{
    ok: boolean;
    faucet: { index: number; evmAddress: string; coreAddress: string; initialBalanceCfx: number };
  }>;
  /** Fund an address; space is auto-detected from the address prefix. */
  fund(input: {
    address: string;
    amount: string | number;
  }): Promise<{ ok: boolean; txHash: string; space: 'core' | 'espace' }>;
}

export function createAccountsNamespace(http: HttpClient): AccountsNamespace {
  return {
    list: () => http.get('/accounts'),
    faucet: () => http.get('/accounts/faucet'),
    fund: (input) => http.post('/accounts/fund', input),
  };
}

export interface ContractsNamespace {
  list(): Promise<{ ok: boolean; contracts: ContractRecord[] }>;
  get(id: string): Promise<{ ok: boolean; contract: ContractRecord }>;
  register(input: {
    address: string;
    abi: unknown[];
    name: string;
    space?: 'core' | 'espace';
  }): Promise<{ ok: boolean; contract: ContractRecord }>;
  delete(id: string): Promise<OkResponse>;
  clear(): Promise<{ ok: boolean; cleared: number }>;
}

interface ContractRecord {
  id: string;
  name: string;
  address: string;
  abi: unknown[];
  space: 'core' | 'espace';
  deployedAt: number;
}

export function createContractsNamespace(http: HttpClient): ContractsNamespace {
  return {
    list: () => http.get('/contracts'),
    get: (id) => http.get(`/contracts/${encodeURIComponent(id)}`),
    register: (input) => http.post('/contracts/register', input),
    delete: (id) => http.delete(`/contracts/${encodeURIComponent(id)}`),
    clear: () => http.delete('/contracts'),
  };
}

export interface NetworkNamespace {
  current(): Promise<{
    ok: boolean;
    network: 'local' | 'testnet' | 'mainnet';
    espaceRpc: string;
    coreRpc: string;
  }>;
  capabilities(): Promise<{ ok: boolean; capabilities: { faucet: boolean; mining: boolean } }>;
  config(): Promise<{ ok: boolean; config: { espaceRpc: string; coreRpc: string } }>;
  setConfig(key: 'espaceRpc' | 'coreRpc', value: string): Promise<OkResponse>;
  set(network: 'local' | 'testnet' | 'mainnet'): Promise<{
    ok: boolean;
    network: 'local' | 'testnet' | 'mainnet';
    espaceRpc: string;
    coreRpc: string;
  }>;
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
