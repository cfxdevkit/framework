/** Shape of all server `{ ok }` responses. */
export interface OkResponse {
  ok: boolean;
}

/** Account info as returned by `/accounts`. */
export interface AccountInfo {
  index: number;
  evmAddress: string;
  coreAddress: string;
  initialBalanceCfx: number;
}

/** Wallet summary as returned by `/keystore/wallets`. */
export interface WalletSummary {
  id: string;
  name: string;
  active: boolean;
}

/** Keystore status. */
export interface KeystoreStatus {
  ok: boolean;
  locked: boolean;
  initialized: boolean;
  walletCount: number;
}

/** Contract record as stored in the registry. */
export interface ContractRecord {
  id: string;
  name: string;
  address: string;
  abi: unknown[];
  space: 'core' | 'espace';
  deployedAt: number;
}

/** Network type. */
export type Network = 'local' | 'testnet' | 'mainnet';

/** Network config (RPC endpoints). */
export interface NetworkConfig {
  espaceRpc: string;
  coreRpc: string;
}

/** Network capabilities. */
export interface NetworkCapabilities {
  faucet: boolean;
  mining: boolean;
}

/** Mining status. */
export interface MiningStatus {
  running: boolean;
  intervalMs: number | null;
}

/** Node status response from `/node/status`. */
export interface NodeStatus {
  status: string;
  running: boolean;
  urls?: {
    core: string;
    espace: string;
    coreWs: string;
    espaceWs: string;
  };
  faucet?: AccountInfo;
  accounts: AccountInfo[];
}

/** Options for `ConfluxDevkitClient`. */
export interface ConfluxDevkitClientOptions {
  /** Base URL of the devnode-server, e.g. `http://localhost:52000`. */
  baseUrl: string;
  /**
   * Optional fetch implementation. Defaults to the global `fetch`.
   * Useful for Node.js environments or testing.
   */
  fetch?: typeof fetch;
}
