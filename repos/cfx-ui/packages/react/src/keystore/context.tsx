'use client';

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import type {
  DualChainIdentity,
  KeystoreAccount,
  KeystoreActiveWallet,
  KeystoreAddWalletInput,
  KeystorePhase,
  KeystoreService,
  KeystoreWallet,
} from './types.js';
import { useKeystoreMutations } from './use-keystore-mutations.js';

// ── Context value ─────────────────────────────────────────────────────────────

export interface KeystoreContextValue {
  // ---- state ----
  phase: KeystorePhase;
  isLocked: boolean;
  isInitialized: boolean;
  walletCount: number;
  isBusy: boolean;
  error: string | null;
  resetGuidance: {
    paths: string[];
    requiresNodeStop: boolean;
    warning: string;
  } | null;
  /** All wallets (available in 'unlocked' and 'active-wallet' phases). */
  wallets: KeystoreWallet[];
  /** The active wallet's full summary (available in 'active-wallet' phase). */
  activeWallet: KeystoreActiveWallet | null;
  /** Accounts for the active wallet (available in 'active-wallet' phase). */
  accounts: KeystoreAccount[];
  /** Normalized dual-chain identity for the selected wallet + account. */
  identity: DualChainIdentity | null;

  // ---- lifecycle actions ----
  setup(passphrase: string): Promise<void>;
  unlock(passphrase: string): Promise<void>;
  lock(): Promise<void>;
  refresh(): Promise<void>;
  clearError(): void;

  // ---- wallet actions ----
  activateWallet(id: string): Promise<void>;
  addWallet(input: KeystoreAddWalletInput): Promise<void>;
  deleteWallet(id: string): Promise<void>;
  renameWallet(id: string, name: string): Promise<void>;

  // ---- account actions ----
  activateAccount(walletId: string, index: number): Promise<void>;
}

const KeystoreContext = createContext<KeystoreContextValue | null>(null);
KeystoreContext.displayName = 'KeystoreContext';

// ── Provider ──────────────────────────────────────────────────────────────────

export interface KeystoreProviderProps {
  keystore: KeystoreService;
  /** Poll interval in ms. Set to 0 to disable automatic polling. Default: 4000. */
  pollIntervalMs?: number;
  children: ReactNode;
}

/**
 * Distributes keystore state and actions to all child hooks.
 *
 * The provider does NOT create the transport — the app passes in a prebuilt
 * keystore service (e.g. `client.keystore` from @cfxdevkit/client).
 * This keeps SSR and tests straightforward: pass a mock service, get
 * deterministic behaviour.
 */
export function KeystoreProvider({
  keystore,
  pollIntervalMs = 4_000,
  children,
}: KeystoreProviderProps) {
  const [phase, setPhase] = useState<KeystorePhase>('blank');
  const [isLocked, setIsLocked] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [walletCount, setWalletCount] = useState(0);
  const [resetGuidance, setResetGuidance] = useState<KeystoreContextValue['resetGuidance']>(null);

  const [wallets, setWallets] = useState<KeystoreWallet[]>([]);
  const [activeWallet, setActiveWallet] = useState<KeystoreActiveWallet | null>(null);
  const [accounts, setAccounts] = useState<KeystoreAccount[]>([]);

  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const keystoreRef = useRef(keystore);
  useEffect(() => {
    keystoreRef.current = keystore;
  }, [keystore]);

  // ── Full state refresh ─────────────────────────────────────────────────────

  const refresh = useCallback(async () => {
    try {
      const status = await keystoreRef.current.status();
      setPhase(status.phase);
      setIsLocked(status.locked);
      setIsInitialized(status.initialized);
      setWalletCount(status.walletCount);
      setResetGuidance(
        status.reset
          ? {
              paths: status.reset.paths,
              requiresNodeStop: status.reset.requiresNodeStop,
              warning: status.reset.warning,
            }
          : null,
      );

      if (status.phase === 'unlocked' || status.phase === 'active-wallet') {
        const walletsResult = await keystoreRef.current.wallets.list();
        setWallets(walletsResult.wallets ?? []);
      } else {
        setWallets([]);
      }

      if (status.phase === 'active-wallet') {
        const activeResult = await keystoreRef.current.active();
        const nextActive = activeResult.wallet ?? null;
        setActiveWallet(nextActive);

        if (nextActive) {
          const accountsResult = await keystoreRef.current.wallets.accounts(nextActive.id);
          setAccounts(accountsResult.accounts ?? []);
        } else {
          setAccounts([]);
        }
      } else {
        setActiveWallet(null);
        setAccounts([]);
      }
    } catch {
      // Silently ignore poll errors — status will be stale until next poll succeeds
    }
  }, []);

  // ── Initial load + polling ─────────────────────────────────────────────────

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (pollIntervalMs <= 0) return;
    const id = setInterval(refresh, pollIntervalMs);
    return () => clearInterval(id);
  }, [refresh, pollIntervalMs]);

  // ── Lifecycle actions ──────────────────────────────────────────────────────

  const setup = useCallback(
    async (passphrase: string) => {
      setIsBusy(true);
      setError(null);
      try {
        await keystoreRef.current.setup({ passphrase });
        await refresh();
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
      } finally {
        setIsBusy(false);
      }
    },
    [refresh],
  );

  const unlock = useCallback(
    async (passphrase: string) => {
      setIsBusy(true);
      setError(null);
      try {
        await keystoreRef.current.unlock({ passphrase });
        await refresh();
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
      } finally {
        setIsBusy(false);
      }
    },
    [refresh],
  );

  const lock = useCallback(async () => {
    setIsBusy(true);
    setError(null);
    try {
      await keystoreRef.current.lock();
      await refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setIsBusy(false);
    }
  }, [refresh]);

  // ── Wallet + account mutations ─────────────────────────────────────────────

  const { activateWallet, addWallet, deleteWallet, renameWallet, activateAccount } =
    useKeystoreMutations({
      keystoreRef,
      setWallets,
      setActiveWallet,
      setAccounts,
      setIsBusy,
      setError,
      refresh,
    });

  // ── Identity derivation ────────────────────────────────────────────────────

  const identity: DualChainIdentity | null =
    activeWallet && accounts.length > 0
      ? (() => {
          const activeAccount = accounts.find((a) => a.active) ?? accounts[0];
          if (!activeAccount) return null;
          return {
            walletId: activeWallet.id,
            walletName: activeWallet.name,
            accountIndex: activeAccount.index,
            accountType: activeWallet.accountType,
            espaceAddress: activeAccount.espaceAddress,
            coreAddress: activeAccount.coreAddress,
            espaceDerivationPath: activeAccount.espaceDerivationPath,
            coreDerivationPath: activeAccount.coreDerivationPath,
          };
        })()
      : null;

  const clearError = useCallback(() => setError(null), []);

  const value: KeystoreContextValue = {
    phase,
    isLocked,
    isInitialized,
    walletCount,
    isBusy,
    error,
    resetGuidance,
    wallets,
    activeWallet,
    accounts,
    identity,
    setup,
    unlock,
    lock,
    refresh,
    clearError,
    activateWallet,
    addWallet,
    deleteWallet,
    renameWallet,
    activateAccount,
  };

  return <KeystoreContext.Provider value={value}>{children}</KeystoreContext.Provider>;
}

// ── Internal hook ─────────────────────────────────────────────────────────────

/**
 * Internal: returns the full context value.
 * Public hooks call this and select specific slices.
 */
export function useKeystoreContext(): KeystoreContextValue {
  const ctx = useContext(KeystoreContext);
  if (!ctx) {
    throw new Error(
      '`useKeystore*` hooks must be used inside a `<KeystoreProvider>`. ' +
        'Wrap your component tree with `<KeystoreProvider keystore={...}>`.',
    );
  }
  return ctx;
}
