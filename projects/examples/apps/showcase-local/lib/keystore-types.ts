export interface KeystoreActionResponse {
  ok: boolean;
  error?: string;
  walletCount?: number;
}

export interface KeystoreStatusResponse extends KeystoreActionResponse {
  initialized: boolean;
  locked: boolean;
  walletCount: number;
}

export interface KeystoreWalletSummary {
  id: string;
  name: string;
  active: boolean;
  accountCount: number;
  activeAccountIndex: number;
  derivationBase: string;
  firstAddress?: string;
}

export interface KeystoreActiveWalletSummary extends KeystoreWalletSummary {
  address: string;
  coreAddress?: string;
  derivationPath: string;
}

export interface KeystoreWalletAccountSummary {
  index: number;
  derivationPath: string;
  address: string;
  coreAddress?: string;
  active: boolean;
}

export interface KeystoreWalletsResponse extends KeystoreActionResponse {
  wallets: KeystoreWalletSummary[];
}

export interface KeystoreWalletAccountsResponse extends KeystoreActionResponse {
  accounts: KeystoreWalletAccountSummary[];
}

export interface KeystoreWalletMutationResponse extends KeystoreActionResponse {
  wallet?: KeystoreWalletSummary;
}

export interface KeystoreActiveWalletResponse extends KeystoreActionResponse {
  wallet: KeystoreActiveWalletSummary | null;
}

export interface CreateKeystoreWalletRequest {
  mnemonic?: string;
  name?: string;
}

export interface RenameKeystoreWalletRequest {
  name?: string;
}