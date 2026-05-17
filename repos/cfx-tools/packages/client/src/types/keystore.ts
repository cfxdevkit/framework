/** Wallet summary as returned by `/keystore/wallets`. */
export interface WalletSummary {
  id: string;
  name: string;
  active: boolean;
  accountCount: number;
  activeAccountIndex: number;
  accountType: 'standard' | 'mining';
  firstEspaceAddress?: string;
}

export interface ActiveWalletSummary extends WalletSummary {
  espaceAddress: string;
  coreAddress: string;
  espaceDerivationPath: string;
  coreDerivationPath: string;
}

export interface WalletAccountSummary {
  index: number;
  espaceDerivationPath: string;
  espaceAddress: string;
  coreAddress: string;
  coreDerivationPath: string;
  active: boolean;
}

export type RevealKind = 'mnemonic' | 'private-key';

export interface RevealRequestInput {
  accountIndex?: number;
  kind: RevealKind;
  passphrase: string;
  ttlMs?: number;
  walletId: string;
}

export interface RevealRequestSummary {
  accountIndex?: number;
  expiresAt: number;
  kind: RevealKind;
  token: string;
  walletId: string;
  warning: string;
}

export interface RevealRequestResponse {
  ok: boolean;
  request: RevealRequestSummary;
}

export interface RevealedSecret {
  accountIndex?: number;
  coreAddress?: string;
  coreDerivationPath?: string;
  espaceAddress?: string;
  espaceDerivationPath?: string;
  kind: RevealKind;
  mnemonic?: string;
  privateKey?: string;
  walletId: string;
}

export interface RevealConsumeResponse {
  ok: boolean;
  reveal: RevealedSecret;
}

/** Keystore status. */
export interface KeystoreStatus {
  ok: boolean;
  phase: 'blank' | 'locked' | 'unlocked' | 'active-wallet';
  locked: boolean;
  initialized: boolean;
  walletCount: number;
  reset?: {
    destructive: true;
    mode: 'cli';
    paths: string[];
    requiresNodeStop: boolean;
    warning: string;
  };
}

export interface NodeProfileSummary {
  id: string;
  name: string;
  dataDir: string;
  selected: boolean;
  locked: boolean;
  accountCount: number;
  firstAddress?: string;
}

export interface NodeProfileState {
  ok: boolean;
  error?: string;
  locked: boolean;
  profiles: NodeProfileSummary[];
  selectedProfile: NodeProfileSummary | null;
}

export interface NodeProfileSelection {
  ok: boolean;
  error?: string;
  profile?: NodeProfileSummary;
}
