'use client';

import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import { useCallback } from 'react';
import type {
  KeystoreAccount,
  KeystoreActiveWallet,
  KeystoreAddWalletInput,
  KeystoreService,
  KeystoreWallet,
} from './types.js';

type Set<T> = Dispatch<SetStateAction<T>>;

interface UseKeystoreMutationsOptions {
  keystoreRef: MutableRefObject<KeystoreService>;
  setWallets: Set<KeystoreWallet[]>;
  setActiveWallet: Set<KeystoreActiveWallet | null>;
  setAccounts: Set<KeystoreAccount[]>;
  setIsBusy: Set<boolean>;
  setError: Set<string | null>;
  refresh: () => Promise<void>;
}

export function useKeystoreMutations({
  keystoreRef,
  setWallets,
  setActiveWallet,
  setAccounts,
  setIsBusy,
  setError,
  refresh,
}: UseKeystoreMutationsOptions) {
  // ── Wallet actions ─────────────────────────────────────────────────────────

  const activateWallet = useCallback(
    async (id: string) => {
      setIsBusy(true);
      setError(null);
      try {
        await keystoreRef.current.wallets.activate(id);
        await refresh();
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
      } finally {
        setIsBusy(false);
      }
    },
    [refresh, setIsBusy, setError, keystoreRef.current.wallets.activate],
  );

  const addWallet = useCallback(
    async (input: KeystoreAddWalletInput) => {
      setIsBusy(true);
      setError(null);
      try {
        await keystoreRef.current.wallets.add(input);
        await refresh();
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
      } finally {
        setIsBusy(false);
      }
    },
    [refresh, setError, keystoreRef.current.wallets.add, setIsBusy],
  );

  const deleteWallet = useCallback(
    async (id: string) => {
      // Optimistic: remove from list immediately; clear active wallet if it was deleted.
      setWallets((ws) => ws.filter((w) => w.id !== id));
      setActiveWallet((aw) => (aw?.id === id ? null : aw));
      setIsBusy(true);
      setError(null);
      try {
        await keystoreRef.current.wallets.delete(id);
        await refresh(); // needed to sync phase (e.g., last wallet deleted → 'unlocked')
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        await refresh(); // roll back to server state on error
      } finally {
        setIsBusy(false);
      }
    },
    [
      refresh,
      setError, // Optimistic: remove from list immediately; clear active wallet if it was deleted.
      setWallets,
      setIsBusy,
      setActiveWallet,
      keystoreRef.current.wallets.delete,
    ],
  );

  const renameWallet = useCallback(
    async (id: string, name: string) => {
      // Optimistic: reflect the new name immediately so the UI feels instant.
      setWallets((ws) => ws.map((w) => (w.id === id ? { ...w, name } : w)));
      setActiveWallet((aw) => (aw?.id === id ? { ...aw, name } : aw));
      setIsBusy(true);
      setError(null);
      try {
        await keystoreRef.current.wallets.rename(id, name);
        // Confirm in background — the optimistic update is already visible.
        void refresh();
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        await refresh(); // roll back to server state on error
      } finally {
        setIsBusy(false);
      }
    },
    [
      refresh,
      setIsBusy,
      setActiveWallet, // Optimistic: reflect the new name immediately so the UI feels instant.
      setWallets,
      setError,
      keystoreRef.current.wallets.rename,
    ],
  );

  // ── Account actions ────────────────────────────────────────────────────────

  const activateAccount = useCallback(
    async (walletId: string, index: number) => {
      // Optimistic: mark the target account active immediately.
      setAccounts((accs) => accs.map((a) => ({ ...a, active: a.index === index })));
      setIsBusy(true);
      setError(null);
      try {
        await keystoreRef.current.wallets.activateAccount(walletId, index);
        void refresh(); // confirm in background
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        await refresh(); // roll back on error
      } finally {
        setIsBusy(false);
      }
    },
    [
      refresh, // Optimistic: mark the target account active immediately.
      setAccounts,
      setIsBusy,
      setError,
      keystoreRef.current.wallets.activateAccount,
    ],
  );

  return { activateWallet, addWallet, deleteWallet, renameWallet, activateAccount };
}
