// Core wallet/keystore types — canonical source is @cfxdevkit/client
export type {
  KeystoreStatus as KeystoreStatusResponse,
  WalletSummary as KeystoreWalletSummary,
  ActiveWalletSummary as KeystoreActiveWalletSummary,
  WalletAccountSummary as KeystoreWalletAccountSummary,
} from '@cfxdevkit/client';

import type { ActiveWalletSummary, WalletAccountSummary, WalletSummary } from '@cfxdevkit/client';

/** Thin ok+error response. */
export interface KeystoreActionResponse {
  ok: boolean;
  error?: string;
}

/** Response wrappers used by the showcase keystore client. */
export interface KeystoreWalletsResponse extends KeystoreActionResponse {
  wallets: WalletSummary[];
}

export interface KeystoreWalletAccountsResponse extends KeystoreActionResponse {
  accounts: WalletAccountSummary[];
}

export interface KeystoreWalletMutationResponse extends KeystoreActionResponse {
  wallet?: WalletSummary;
}

export interface KeystoreActiveWalletResponse extends KeystoreActionResponse {
  wallet: ActiveWalletSummary | null;
}

/** Request shapes for keystore mutations. */
export interface CreateKeystoreWalletRequest {
  mnemonic?: string;
  name?: string;
  accountCount?: number;
  accountType?: string;
}

export interface RenameKeystoreWalletRequest {
  name?: string;
}
