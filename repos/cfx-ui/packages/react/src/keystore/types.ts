/**
 * Mirror types for the keystore namespace from @cfxdevkit/client.
 * These interfaces are defined here so @cfxdevkit/react does not take
 * a hard compile-time dependency on @cfxdevkit/client.
 * The consumer passes in any object that satisfies these interfaces.
 */

export type AccountType = 'standard' | 'mining';
export type KeystorePhase = 'blank' | 'locked' | 'unlocked' | 'active-wallet';

/** Wallet-root summary — matches WalletSummary in @cfxdevkit/client */
export interface KeystoreWallet {
  id: string;
  name: string;
  active: boolean;
  accountCount: number;
  activeAccountIndex: number;
  accountType: AccountType;
  firstEspaceAddress?: string;
}

/** Active wallet summary — extends KeystoreWallet with dual-chain identity for the active account */
export interface KeystoreActiveWallet extends KeystoreWallet {
  espaceAddress: string;
  coreAddress: string;
  espaceDerivationPath: string;
  coreDerivationPath: string;
}

/** Per-account entry in the accounts list for a wallet */
export interface KeystoreAccount {
  index: number;
  espaceDerivationPath: string;
  espaceAddress: string;
  coreAddress: string;
  coreDerivationPath: string;
  active: boolean;
}

/** Normalized dual-chain identity for the currently active wallet + account */
export interface DualChainIdentity {
  walletId: string;
  walletName: string;
  accountIndex: number;
  accountType: AccountType;
  espaceAddress: string;
  coreAddress: string;
  espaceDerivationPath: string;
  coreDerivationPath: string;
}

/** Subset of the keystore status returned by the server */
export interface KeystoreStatusResult {
  phase: KeystorePhase;
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

/** Wallet action result */
export interface KeystoreActionResult {
  ok: boolean;
}

/** Wallet mutation result (includes new wallet id) */
export interface KeystoreWalletMutationResult extends KeystoreActionResult {
  wallet?: KeystoreWallet;
}

export interface KeystoreAddWalletInput {
  /** BIP-39 mnemonic. Required when adding a wallet — generate one if creating fresh. */
  mnemonic: string;
  /** Human-readable wallet label. */
  name: string;
  accountCount?: number;
  accountType?: AccountType;
}

/**
 * The keystore service interface consumed by KeystoreProvider.
 * Mirrors the KeystoreNamespace from @cfxdevkit/client so the
 * consumer can pass in their already-created client without any
 * extra wrapping.
 */
export interface KeystoreService {
  status(): Promise<KeystoreStatusResult>;
  setup(input: { passphrase: string }): Promise<KeystoreActionResult>;
  unlock(input: { passphrase: string }): Promise<KeystoreActionResult>;
  lock(): Promise<KeystoreActionResult>;
  active(): Promise<{ ok: boolean; wallet?: KeystoreActiveWallet | null }>;
  wallets: {
    list(): Promise<{ ok: boolean; wallets: KeystoreWallet[] }>;
    add(input: KeystoreAddWalletInput): Promise<KeystoreWalletMutationResult>;
    activate(id: string): Promise<KeystoreActionResult>;
    delete(id: string): Promise<KeystoreActionResult>;
    rename(id: string, name: string): Promise<KeystoreActionResult>;
    accounts(id: string): Promise<{ ok: boolean; accounts: KeystoreAccount[] }>;
    activateAccount(id: string, index: number): Promise<KeystoreActionResult>;
  };
}
