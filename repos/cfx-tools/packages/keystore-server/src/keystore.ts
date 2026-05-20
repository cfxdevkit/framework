import type { Signer } from '@cfxdevkit/core';
import { KeystoreRuntime } from './keystore/runtime.js';

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
  espaceAddress: string;
  espaceDerivationPath: string;
  coreAddress: string;
  coreDerivationPath: string;
  active: boolean;
}

export type RevealKind = 'mnemonic' | 'private-key';

export interface RevealRequestSummary {
  token: string;
  kind: RevealKind;
  walletId: string;
  expiresAt: number;
  warning: string;
  accountIndex?: number;
}

export interface RevealedSecret {
  kind: RevealKind;
  walletId: string;
  mnemonic?: string;
  privateKey?: string;
  espaceAddress?: string;
  coreAddress?: string;
  espaceDerivationPath?: string;
  accountIndex?: number;
}

export type KeystoreLifecyclePhase = 'blank' | 'locked' | 'unlocked' | 'active-wallet';

export interface KeystoreResetGuidance {
  destructive: true;
  mode: 'cli';
  paths: string[];
  requiresNodeStop: boolean;
  warning: string;
}

export interface KeystoreStatus {
  phase: KeystoreLifecyclePhase;
  locked: boolean;
  initialized: boolean;
  walletCount: number;
  reset?: KeystoreResetGuidance;
}

export class KeystoreService {
  readonly #runtime: KeystoreRuntime;

  constructor(path: string) {
    this.#runtime = new KeystoreRuntime(path);
  }

  async status(): Promise<KeystoreStatus> {
    return this.#runtime.status();
  }

  async setup(passphrase: string): Promise<void> {
    return this.#runtime.setup(passphrase);
  }

  async unlock(passphrase: string): Promise<void> {
    return this.#runtime.unlock(passphrase);
  }

  lock(): void {
    this.#runtime.lock();
  }

  listWallets(): WalletSummary[] {
    return this.#runtime.listWallets();
  }

  async activeWallet(coreNetworkId?: number): Promise<ActiveWalletSummary | null> {
    return this.#runtime.activeWallet(coreNetworkId);
  }

  async activeSigner(): Promise<Signer> {
    return this.#runtime.activeSigner();
  }

  async readWalletMnemonic(id: string): Promise<string> {
    return this.#runtime.readWalletMnemonic(id);
  }

  async addWallet(
    mnemonic: string,
    name: string,
    options: { accountCount?: number; accountType?: string } = {},
  ): Promise<WalletSummary> {
    return this.#runtime.addWallet(mnemonic, name, options);
  }

  async activateWallet(id: string, accountIndex?: number): Promise<void> {
    return this.#runtime.activateWallet(id, accountIndex);
  }

  async listAccounts(id: string, coreNetworkId?: number): Promise<WalletAccountSummary[]> {
    return this.#runtime.listAccounts(id, coreNetworkId);
  }

  async activateAccount(id: string, accountIndex: number): Promise<void> {
    return this.#runtime.activateAccount(id, accountIndex);
  }

  async createRevealRequest(input: {
    walletId: string;
    passphrase: string;
    kind: RevealKind;
    accountIndex?: number;
    ttlMs?: number;
  }): Promise<RevealRequestSummary> {
    return this.#runtime.createRevealRequest(input);
  }

  consumeRevealRequest(token: string): RevealedSecret {
    return this.#runtime.consumeRevealRequest(token);
  }

  async deleteWallet(id: string): Promise<void> {
    return this.#runtime.deleteWallet(id);
  }

  async renameWallet(id: string, name: string): Promise<void> {
    return this.#runtime.renameWallet(id, name);
  }
}
