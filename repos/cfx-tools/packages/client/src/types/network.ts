import type { Network, NetworkMode, SignerSource } from './contracts.js';

/** Network config (RPC endpoints). */
export interface NetworkConfig {
  espaceRpc: string;
  coreRpc: string;
}

/** Effective chain ids for the selected runtime profile. */
export interface NetworkChainIds {
  core: number;
  espace: number;
}

/** Network capabilities. */
export interface NetworkCapabilities {
  faucet: boolean;
  mining: boolean;
  contractDeployLocal: boolean;
  contractDeployPublic: boolean;
  contractReadPublic: boolean;
  contractWritePublic: boolean;
}

/** Flattened network profile returned by `/network/current` and `/network/set`. */
export interface NetworkProfileResponse {
  ok: boolean;
  walletId: string | null;
  mode: NetworkMode;
  network: Network;
  chainIds: NetworkChainIds;
  espaceRpc: string;
  coreRpc: string;
}

/** Network capabilities response. */
export interface NetworkCapabilitiesResponse {
  ok: boolean;
  mode: NetworkMode;
  capabilities: NetworkCapabilities;
}

/** Network config response. */
export interface NetworkConfigResponse {
  ok: boolean;
  config: NetworkConfig;
  chainIds: NetworkChainIds;
}

/** Generic contract read response. */
export interface ContractReadResponse {
  ok: boolean;
  result: unknown;
}

/** Generic contract write response. */
export interface ContractWriteResponse {
  ok: boolean;
  hash: string;
  receipt: unknown;
  signerAccountIndex?: number;
  signerSource?: SignerSource;
}

/** Tracked contract call response, read or write depending on ABI mutability. */
export type TrackedContractCallResponse = ContractReadResponse | ContractWriteResponse;
