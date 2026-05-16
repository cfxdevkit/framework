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
  network: 'local' | 'testnet' | 'mainnet';
  chainId: number;
  space: 'core' | 'espace';
  deployedAt: number;
  constructorArgs?: unknown[];
  deployer?: string;
  metadata?: Record<string, unknown>;
  txHash?: string;
}

/** Compiler warning entry. */
export interface CompileWarning {
  message: string;
  severity: string;
}

/** Compiled contract artifact returned by the runtime compiler route. */
export interface CompileArtifact {
  abi: unknown[];
  bytecode: string;
  cached?: boolean;
  contractName: string;
  deployedBytecode: string;
  inputHash: string;
  warnings: CompileWarning[];
}

/** Network type. */
export type Network = 'local' | 'testnet' | 'mainnet';

/** Runtime network mode. */
export type NetworkMode = 'local' | 'public';

/** Runtime target space. */
export type Space = 'core' | 'espace';

/** Public signer source used by runtime write operations. */
export type SignerSource = 'env' | 'request' | 'keystore' | (string & {});

/** Session-key capability payload echoed by the runtime api. */
export interface SessionCapability {
  chains: number[] | null;
  contracts: string[] | null;
  maxValuePerTx: string | null;
  notAfter: number | null;
  selectors: string[] | null;
}

/** Session-key issue response. */
export interface SessionKeyIssueResponse {
  attestation: { digest: string; message: string; signature: string };
  capability: SessionCapability;
  ok: boolean;
  parent: string;
  session: string;
}

/** Session-key verify response. */
export interface SessionKeyVerifyResponse {
  message: string;
  ok: boolean;
  valid: boolean;
}

/** Deploy receipt summary returned by the runtime deploy route. */
export interface DeployReceiptSummary {
  blockHash: string | null;
  blockNumber: string | null;
  status: string | null;
  transactionHash: string | null;
}

/** Deploy result returned by the runtime deploy route. */
export interface DeployRunResponse {
  address: string | null;
  contractId?: string;
  hash: string;
  mode: NetworkMode;
  network: Network;
  ok: boolean;
  receipt: DeployReceiptSummary | null;
  signerAccountIndex?: number;
  signerSource?: SignerSource;
  space: Space;
}

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
