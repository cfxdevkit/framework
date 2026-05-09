export type Network = 'local' | 'testnet' | 'mainnet';

export interface NetworkConfig {
  espaceRpc: string;
  coreRpc: string;
}

export interface NetworkCapabilities {
  faucet: boolean;
  mining: boolean;
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

export class NetworkState {
  #network: Network = 'local';
  #overrides: Partial<NetworkConfig> = {};

  current(): Network {
    return this.#network;
  }

  config(): NetworkConfig {
    return { ...RPC_DEFAULTS[this.#network], ...this.#overrides };
  }

  set(network: Network): void {
    this.#network = network;
    this.#overrides = {};
  }

  setConfig(key: keyof NetworkConfig, value: string): void {
    this.#overrides[key] = value;
  }

  capabilities(): NetworkCapabilities {
    return {
      faucet: this.#network === 'local',
      mining: this.#network === 'local',
    };
  }
}
