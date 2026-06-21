import type { Signer } from '@cfxdevkit/cdk';

/** Discriminated union describing the active backend. */
export type SignerSessionKind = 'memory' | 'file-keystore' | 'onekey' | 'ledger';

/**
 * A resolved signer session: two ready `Signer` instances
 * (eSpace is always present; Core Space is present for all backends except
 * memory when `coreNetworkId` is not provided — currently always provided).
 */
export interface SignerSession {
  readonly kind: SignerSessionKind;
  /** Human-readable label for logging / UI. */
  readonly label: string;
  /** eSpace (EVM-compatible) signer. */
  readonly eSpace: Signer;
  /** Core Space (Conflux-native) signer. `account.coreAddress` is set. */
  readonly core?: Signer;
  /**
   * Release resources held by this session (close hardware transport,
   * zero in-memory keys where possible). No-op for memory / file sessions.
   */
  dispose(): Promise<void>;
}

export interface MemorySignerInput {
  kind: 'memory';
  /** 0x-prefixed secp256k1 private key. */
  privateKey: `0x${string}`;
  /** eSpace chain ID. Default 1030 (mainnet). */
  espaceChainId?: number;
  /** Core Space network ID for base32 encoding. Default 1029 (mainnet). */
  coreNetworkId?: number;
}

export interface FileKeystoreSignerInput {
  kind: 'file-keystore';
  /**
   * Path to the encrypted keystore JSON file.
   * Falls back to `CFX_KEYSTORE_PATH` env var.
   */
  path?: string;
  /**
   * Decryption passphrase.
   * Falls back to `CFX_PASSPHRASE` env var.
   */
  passphrase?: string;
  /** Logical service / namespace. Falls back to `CFX_KEYSTORE_SERVICE` or `"cfxdevkit"`. */
  service?: string;
  /** Secret name within the service. Falls back to `CFX_KEYSTORE_ACCOUNT` or `"default"`. */
  account?: string;
  /** HD account index. Default 0. */
  accountIndex?: number;
  /** eSpace chain ID. Default 1030. */
  espaceChainId?: number;
  /** Core Space network ID. Default 1029. */
  coreNetworkId?: number;
}

export interface OneKeySignerInput {
  kind: 'onekey';
  /** Initialised OneKey SDK instance (inject to avoid bundling the SDK here). */
  // biome-ignore lint/suspicious/noExplicitAny: SDK type from peer package
  sdk: any;
  connectId: string;
  deviceId: string;
  /** When false, skip Core signer initialisation (useful for reachability checks). */
  includeCore?: boolean;
  /** eSpace BIP-44 path. Default `m/44'/60'/0'/0/0`. */
  espacePath?: string;
  /** Core Space BIP-44 path. Default `m/44'/503'/0'/0/0`. */
  corePath?: string;
  espaceChainId?: number;
  coreNetworkId?: number;
}

export interface LedgerSignerInput {
  kind: 'ledger';
  /** Open HID/USB transport (e.g. from `createNodeHidLedgerTransport`). */
  // biome-ignore lint/suspicious/noExplicitAny: transport type from peer package
  transport: any;
  espaceChainId?: number;
  coreNetworkId?: number;
}

export type SignerSessionInput =
  | MemorySignerInput
  | FileKeystoreSignerInput
  | OneKeySignerInput
  | LedgerSignerInput;
