import type { HttpClient } from './http.js';
import type {
  ActiveWalletSummary,
  ContractReadResponse,
  ContractRecord,
  ContractWriteResponse,
  KeystoreStatus,
  NodeProfileSelection,
  NodeProfileState,
  NodeStatus,
  OkResponse,
  Space,
  TrackedContractCallResponse,
  WalletAccountSummary,
  WalletSummary,
} from './types.js';

export type {
  CompilerNamespace,
  DeployNamespace,
  MiningNamespace,
  NetworkNamespace,
  SessionKeysNamespace,
} from './namespaces-runtime.js';
export {
  createCompilerNamespace,
  createDeployNamespace,
  createMiningNamespace,
  createNetworkNamespace,
  createSessionKeysNamespace,
} from './namespaces-runtime.js';

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
  profiles(): Promise<NodeProfileState>;
  selectProfile(id: string): Promise<NodeProfileSelection>;
}

export function createNodeNamespace(http: HttpClient): NodeNamespace {
  return {
    status: () => http.get('/node/status'),
    start: (input?) => http.post('/node/start', input ?? {}),
    stop: () => http.post('/node/stop'),
    restart: (input?) => http.post('/node/restart', input ?? {}),
    wipe: (input?) => http.post('/node/wipe', input ?? {}),
    mine: (input?) => http.post('/node/mine', input ?? {}),
    profiles: () => http.get('/node/profile'),
    selectProfile: (id) => http.put(`/node/profile/${encodeURIComponent(id)}/select`),
  };
}

export interface KeystoreNamespace {
  status(): Promise<KeystoreStatus>;
  setup(input: { passphrase: string }): Promise<{ ok: boolean; walletCount: number }>;
  unlock(input: { passphrase: string }): Promise<OkResponse>;
  lock(): Promise<OkResponse>;
  active(): Promise<{ ok: boolean; wallet: ActiveWalletSummary | null }>;
  wallets: {
    list(): Promise<{ ok: boolean; wallets: WalletSummary[] }>;
    add(input: {
      mnemonic: string;
      name: string;
      accountCount?: number;
      derivationBase?: string;
    }): Promise<{ ok: boolean; wallet: WalletSummary }>;
    activate(id: string, input?: { accountIndex?: number }): Promise<OkResponse>;
    accounts(id: string): Promise<{ ok: boolean; accounts: WalletAccountSummary[] }>;
    delete(id: string): Promise<OkResponse>;
    rename(id: string, name: string): Promise<OkResponse>;
    activateAccount(id: string, index: number): Promise<OkResponse>;
  };
}

export function createKeystoreNamespace(http: HttpClient): KeystoreNamespace {
  return {
    status: () => http.get('/keystore/status'),
    setup: (input) => http.post('/keystore/setup', input),
    unlock: (input) => http.post('/keystore/unlock', input),
    lock: () => http.post('/keystore/lock'),
    active: () => http.get('/keystore/active'),
    wallets: {
      list: () => http.get('/keystore/wallets'),
      add: (input) => http.post('/keystore/wallets', input),
      activate: (id, input) =>
        http.put(`/keystore/wallets/${encodeURIComponent(id)}/activate`, input ?? {}),
      accounts: (id) => http.get(`/keystore/wallets/${encodeURIComponent(id)}/accounts`),
      delete: (id) => http.delete(`/keystore/wallets/${encodeURIComponent(id)}`),
      rename: (id, name) =>
        http.patch(`/keystore/wallets/${encodeURIComponent(id)}/rename`, { name }),
      activateAccount: (id, index) =>
        http.put(`/keystore/wallets/${encodeURIComponent(id)}/accounts/${index}/activate`),
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
  list(input?: {
    chainId?: number;
    network?: 'local' | 'testnet' | 'mainnet';
    space?: Space;
  }): Promise<{ ok: boolean; contracts: ContractRecord[] }>;
  get(id: string): Promise<{ ok: boolean; contract: ContractRecord }>;
  register(input: {
    address: string;
    abi: unknown[];
    chainId?: number;
    constructorArgs?: unknown[];
    deployer?: string;
    metadata?: Record<string, unknown>;
    name: string;
    network?: 'local' | 'testnet' | 'mainnet';
    space?: Space;
    txHash?: string;
  }): Promise<{ ok: boolean; contract: ContractRecord }>;
  read(input: {
    abi: unknown[];
    address: string;
    args?: unknown[];
    blockTag?: 'latest' | 'pending' | 'earliest' | 'finalized' | 'safe' | string | number;
    epochTag?: string;
    from?: string;
    functionName: string;
    network?: 'local' | 'testnet' | 'mainnet';
    space?: Space;
  }): Promise<ContractReadResponse>;
  write(input: {
    accountIndex?: number;
    abi: unknown[];
    address: string;
    args?: unknown[];
    functionName: string;
    network?: 'local' | 'testnet' | 'mainnet';
    privateKey?: string;
    space?: Space;
    value?: number | string;
    waitForReceipt?: boolean;
  }): Promise<ContractWriteResponse>;
  call(
    id: string,
    input: {
      accountIndex?: number;
      args?: unknown[];
      functionName: string;
      privateKey?: string;
      value?: number | string;
      waitForReceipt?: boolean;
    },
  ): Promise<TrackedContractCallResponse>;
  delete(id: string): Promise<OkResponse>;
  clear(): Promise<{ ok: boolean; cleared: number }>;
}

export function createContractsNamespace(http: HttpClient): ContractsNamespace {
  return {
    list: (input) => {
      const searchParams = new URLSearchParams();
      if (input?.network) {
        searchParams.set('network', input.network);
      }
      if (input?.space) {
        searchParams.set('space', input.space);
      }
      if (input?.chainId !== undefined) {
        searchParams.set('chainId', String(input.chainId));
      }
      const query = searchParams.toString();
      return http.get(query ? `/contracts?${query}` : '/contracts');
    },
    get: (id) => http.get(`/contracts/${encodeURIComponent(id)}`),
    register: (input) => http.post('/contracts/register', input),
    read: (input) => http.post('/contracts/read', input),
    write: (input) => http.post('/contracts/write', input),
    call: (id, input) => http.post(`/contracts/${encodeURIComponent(id)}/call`, input),
    delete: (id) => http.delete(`/contracts/${encodeURIComponent(id)}`),
    clear: () => http.delete('/contracts'),
  };
}
