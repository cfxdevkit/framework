import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

export type Network = 'local' | 'testnet' | 'mainnet';
export type NetworkMode = 'local' | 'public';

export interface NetworkConfig {
  espaceRpc: string;
  coreRpc: string;
}

export interface NetworkChainIds {
  core: number;
  espace: number;
}

export interface NetworkCapabilities {
  faucet: boolean;
  mining: boolean;
  contractDeployLocal: boolean;
  contractDeployPublic: boolean;
  contractReadPublic: boolean;
  contractWritePublic: boolean;
}

export interface NetworkProfile {
  walletId: string | null;
  mode: NetworkMode;
  network: Network;
  config: NetworkConfig;
  chainIds: NetworkChainIds;
}

export interface NetworkStateOptions {
  storagePath?: string;
}

export type PersistedNetworkConfigKey = keyof NetworkConfig | 'coreChainId' | 'espaceChainId';

interface StoredNetworkProfile {
  chainIds?: Partial<NetworkChainIds>;
  network?: Network;
  overrides?: Partial<NetworkConfig>;
}

interface StoredNetworkProfiles {
  wallets?: Record<string, StoredNetworkProfile>;
}

const RPC_DEFAULTS: Record<Network, NetworkConfig> = {
  local: {
    espaceRpc: 'http://127.0.0.1:8545',
    coreRpc: 'http://127.0.0.1:12537',
  },
  testnet: {
    espaceRpc: 'https://evmtestnet.confluxrpc.com',
    coreRpc: 'https://test.confluxrpc.com',
  },
  mainnet: {
    espaceRpc: 'https://evm.confluxrpc.com',
    coreRpc: 'https://main.confluxrpc.com',
  },
};

const CHAIN_ID_DEFAULTS: Record<Network, NetworkChainIds> = {
  local: { core: 2029, espace: 2030 },
  testnet: { core: 1, espace: 71 },
  mainnet: { core: 1029, espace: 1030 },
};

export function defaultNetworkConfig(network: Network): NetworkConfig {
  return { ...RPC_DEFAULTS[network] };
}

export function defaultNetworkChainIds(network: Network): NetworkChainIds {
  return { ...CHAIN_ID_DEFAULTS[network] };
}

export class NetworkState {
  readonly #storagePath: string | undefined;
  #activeWalletId: string | null = null;
  #chainIdOverrides: Partial<NetworkChainIds> = {};
  #network: Network = 'local';
  #overrides: Partial<NetworkConfig> = {};

  constructor(options: NetworkStateOptions = {}) {
    this.#storagePath = options.storagePath;
  }

  current(): Network {
    return this.#network;
  }

  mode(): NetworkMode {
    return this.#network === 'local' ? 'local' : 'public';
  }

  isLocalMode(): boolean {
    return this.mode() === 'local';
  }

  config(): NetworkConfig {
    return { ...defaultNetworkConfig(this.#network), ...this.#overrides };
  }

  chainIds(): NetworkChainIds {
    return { ...defaultNetworkChainIds(this.#network), ...this.#chainIdOverrides };
  }

  profile(): NetworkProfile {
    return {
      walletId: this.#activeWalletId,
      mode: this.mode(),
      network: this.#network,
      config: this.config(),
      chainIds: this.chainIds(),
    };
  }

  async syncWallet(walletId: string | null): Promise<void> {
    if (walletId === this.#activeWalletId) return;

    this.#activeWalletId = walletId;

    if (!walletId) {
      this.#network = 'local';
      this.#overrides = {};
      this.#chainIdOverrides = {};
      return;
    }

    const store = await this.#readStore();
    const profile = store.wallets?.[walletId];
    this.#network = normalizeNetwork(profile?.network) ?? 'local';
    this.#overrides = normalizeOverrides(profile?.overrides);
    this.#chainIdOverrides = normalizeChainIdOverrides(profile?.chainIds);
  }

  async set(network: Network): Promise<NetworkProfile> {
    this.#network = network;
    this.#overrides = {};
    this.#chainIdOverrides = {};
    await this.#persistCurrent();
    return this.profile();
  }

  async setConfig(key: PersistedNetworkConfigKey, value: string | number): Promise<void> {
    if (key === 'coreRpc' || key === 'espaceRpc') {
      this.#overrides[key] = String(value);
      await this.#persistCurrent();
      return;
    }

    const parsed = typeof value === 'number' ? value : Number(value);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      throw new Error(`${key} must be a positive integer`);
    }

    this.#chainIdOverrides[key === 'coreChainId' ? 'core' : 'espace'] = parsed;
    await this.#persistCurrent();
  }

  capabilities(): NetworkCapabilities {
    const local = this.isLocalMode();
    return {
      faucet: local,
      mining: local,
      contractDeployLocal: local,
      contractDeployPublic: !local,
      contractReadPublic: !local,
      contractWritePublic: !local,
    };
  }

  async #persistCurrent(): Promise<void> {
    if (!this.#storagePath || !this.#activeWalletId) return;

    const store = await this.#readStore();
    const wallets = store.wallets ?? {};
    wallets[this.#activeWalletId] = {
      network: this.#network,
      overrides: { ...this.#overrides },
      chainIds: { ...this.#chainIdOverrides },
    };
    await this.#writeStore({ wallets });
  }

  async #readStore(): Promise<StoredNetworkProfiles> {
    if (!this.#storagePath) return {};

    try {
      const raw = await readFile(this.#storagePath, 'utf8');
      const parsed = JSON.parse(raw) as StoredNetworkProfiles;
      return typeof parsed === 'object' && parsed ? parsed : {};
    } catch {
      return {};
    }
  }

  async #writeStore(store: StoredNetworkProfiles): Promise<void> {
    if (!this.#storagePath) return;
    await mkdir(dirname(this.#storagePath), { recursive: true });
    await writeFile(this.#storagePath, JSON.stringify(store, null, 2), 'utf8');
  }
}

function normalizeNetwork(value: unknown): Network | null {
  return value === 'local' || value === 'testnet' || value === 'mainnet' ? value : null;
}

function normalizeOverrides(value: Partial<NetworkConfig> | undefined): Partial<NetworkConfig> {
  if (!value) return {};

  return {
    ...(typeof value.coreRpc === 'string' ? { coreRpc: value.coreRpc } : {}),
    ...(typeof value.espaceRpc === 'string' ? { espaceRpc: value.espaceRpc } : {}),
  };
}

function normalizeChainIdOverrides(
  value: Partial<NetworkChainIds> | undefined,
): Partial<NetworkChainIds> {
  if (!value) return {};

  const core = Number.isInteger(value.core) ? value.core : undefined;
  const espace = Number.isInteger(value.espace) ? value.espace : undefined;

  return {
    ...(typeof core === 'number' && core > 0 ? { core } : {}),
    ...(typeof espace === 'number' && espace > 0 ? { espace } : {}),
  };
}
