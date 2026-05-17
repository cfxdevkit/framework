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
