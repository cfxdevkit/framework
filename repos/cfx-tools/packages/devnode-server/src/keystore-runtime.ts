import { access } from 'node:fs/promises';
import { generateMnemonic } from '@cfxdevkit/core';
import type { SecretRef, StoredSecret } from '@cfxdevkit/services/keystore';
import { createFileKeystore, initFileKeystore } from '@cfxdevkit/services/keystore-file';
import type {
  ActiveWalletSummary,
  KeystoreStatus,
  RevealedSecret,
  RevealKind,
  RevealRequestSummary,
  WalletAccountSummary,
  WalletSummary,
} from './keystore.js';
import {
  isActiveWallet,
  isMnemonicSecret,
  toWalletSummary,
  UNLOCK_PROBE_REF,
  walletActiveAccountIndex,
} from './keystore-domain.js';
import {
  addWalletSecret,
  createRevealSession,
  type KeystoreProvider,
  type LoadedKeystoreState,
  listWalletAccounts,
  loadActiveSigner,
  loadActiveWalletSummary,
  type RevealSession,
  readStoredMnemonic,
  readWalletMnemonicFromState,
  removeWallet,
  renameWallet,
  updateActiveWallet,
} from './keystore-operations.js';

export class KeystoreRuntime {
  readonly #path: string;
  #state: LoadedKeystoreState | null = null;
  #revealSessions = new Map<string, RevealSession>();

  constructor(path: string) {
    this.#path = path;
  }

  async status(): Promise<KeystoreStatus> {
    return {
      locked: this.#state === null,
      initialized: await this.#isInitialized(),
      walletCount: this.#state?.wallets.length ?? 0,
    };
  }

  async setup(passphrase: string): Promise<void> {
    if (await this.#isInitialized()) {
      throw new Error('keystore already initialized — use unlock instead');
    }
    await initFileKeystore({ path: this.#path, passphrase });
    const provider = this.#createProvider(passphrase);
    await provider.put?.({
      ref: UNLOCK_PROBE_REF,
      kind: 'mnemonic',
      secret: generateMnemonic(128),
      meta: { role: 'unlock-probe' },
    });
    this.#state = { passphrase, provider, wallets: [] };
  }

  async unlock(passphrase: string): Promise<void> {
    const provider = this.#createProvider(passphrase);
    const probeRef = await this.#resolveProbeRef(provider);
    if (probeRef) {
      await readStoredMnemonic({ path: this.#path, passphrase, ref: probeRef });
    }
    this.#state = { passphrase, provider, wallets: await this.#listWalletSecrets(provider) };
  }

  lock(): void {
    this.#clearRevealSessions();
    this.#state = null;
  }

  listWallets(): WalletSummary[] {
    return this.#requireUnlocked().wallets.map(toWalletSummary);
  }

  async activeWallet(): Promise<ActiveWalletSummary | null> {
    return loadActiveWalletSummary(this.#requireUnlocked());
  }

  async activeSigner() {
    return loadActiveSigner(this.#requireUnlocked());
  }

  async readWalletMnemonic(id: string): Promise<string> {
    return readWalletMnemonicFromState(this.#path, this.#requireUnlocked(), this.#findWallet(id));
  }

  async addWallet(
    mnemonic: string,
    name: string,
    options: { accountCount?: number; derivationBase?: string } = {},
  ): Promise<WalletSummary> {
    const id = await addWalletSecret(this.#requireUnlocked(), mnemonic, name, options);
    await this.#reloadWallets();
    return this.#findWalletSummary(id);
  }

  async activateWallet(id: string, accountIndex?: number): Promise<void> {
    const state = this.#requireUnlocked();
    const target = this.#findWallet(id);
    const nextAccountIndex =
      accountIndex === undefined ? walletActiveAccountIndex(target) : accountIndex;

    await updateActiveWallet(state, target, nextAccountIndex);
    await this.#reloadWallets();
  }

  async listAccounts(id: string): Promise<WalletAccountSummary[]> {
    return listWalletAccounts(this.#requireUnlocked(), this.#findWallet(id));
  }

  async activateAccount(id: string, accountIndex: number): Promise<void> {
    await this.activateWallet(id, accountIndex);
  }

  async createRevealRequest(input: {
    walletId: string;
    passphrase: string;
    kind: RevealKind;
    accountIndex?: number;
    ttlMs?: number;
  }): Promise<RevealRequestSummary> {
    this.#pruneRevealSessions();
    const wallet = this.#findWallet(input.walletId);

    return createRevealSession({
      ...input,
      path: this.#path,
      ref: wallet.ref,
      wallet,
      revealSessions: this.#revealSessions,
    });
  }

  consumeRevealRequest(token: string): RevealedSecret {
    this.#pruneRevealSessions();
    const session = this.#revealSessions.get(token);
    if (!session) {
      throw new Error('reveal request not found or already consumed');
    }

    this.#revealSessions.delete(token);
    if (session.request.expiresAt <= Date.now()) {
      throw new Error('reveal request expired');
    }

    return session.secret;
  }

  async deleteWallet(id: string): Promise<void> {
    const state = this.#requireUnlocked();
    const target = this.#findWallet(id);
    const wasActive = await removeWallet(state, target);

    this.#clearRevealSessions(id);
    await this.#reloadWallets();

    const nextState = this.#requireUnlocked();
    if (wasActive && nextState.wallets.length > 0 && !nextState.wallets.some(isActiveWallet)) {
      const [nextWallet] = nextState.wallets;
      if (nextWallet) {
        await updateActiveWallet(nextState, nextWallet, walletActiveAccountIndex(nextWallet));
        await this.#reloadWallets();
      }
    }
  }

  async renameWallet(id: string, name: string): Promise<void> {
    await renameWallet(this.#requireUnlocked(), this.#findWallet(id), name);
    await this.#reloadWallets();
  }

  #requireUnlocked(): LoadedKeystoreState {
    if (this.#state === null) throw new Error('keystore is locked');
    return this.#state;
  }

  async #isInitialized(): Promise<boolean> {
    try {
      await access(this.#path);
      return true;
    } catch {
      return false;
    }
  }

  #createProvider(passphrase: string): KeystoreProvider {
    return createFileKeystore({
      path: this.#path,
      unlock: async () => ({ passphrase }),
    });
  }

  async #reloadWallets(): Promise<void> {
    const state = this.#requireUnlocked();
    this.#state = { ...state, wallets: await this.#listWalletSecrets(state.provider) };
  }

  async #listWalletSecrets(provider: KeystoreProvider): Promise<StoredSecret[]> {
    return (await provider.list({ service: 'cfxdevkit' })).filter(isMnemonicSecret);
  }

  async #resolveProbeRef(provider: KeystoreProvider): Promise<SecretRef | null> {
    if (await provider.has(UNLOCK_PROBE_REF)) return UNLOCK_PROBE_REF;
    const [wallet] = await this.#listWalletSecrets(provider);
    return wallet?.ref ?? null;
  }

  #findWallet(id: string): StoredSecret {
    const wallet = this.#requireUnlocked().wallets.find((entry) => entry.ref.account === id);
    if (!wallet) throw new Error(`wallet not found: ${id}`);
    return wallet;
  }

  #findWalletSummary(id: string): WalletSummary {
    return toWalletSummary(this.#findWallet(id));
  }

  #pruneRevealSessions(): void {
    const now = Date.now();
    for (const [token, session] of this.#revealSessions.entries()) {
      if (session.request.expiresAt <= now) {
        this.#revealSessions.delete(token);
      }
    }
  }

  #clearRevealSessions(walletId?: string): void {
    if (!walletId) {
      this.#revealSessions.clear();
      return;
    }

    for (const [token, session] of this.#revealSessions.entries()) {
      if (session.request.walletId === walletId) {
        this.#revealSessions.delete(token);
      }
    }
  }
}
