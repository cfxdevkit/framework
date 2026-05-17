'use client';

import { useKeystoreContext } from './context.js';
import type { KeystoreAddWalletInput, KeystoreWallet } from './types.js';

export interface UseKeystoreWalletsReturn {
  wallets: KeystoreWallet[];
  walletCount: number;
  activeWalletId: string | null;
  isBusy: boolean;
  error: string | null;
  activateWallet(id: string): Promise<void>;
  addWallet(input: KeystoreAddWalletInput): Promise<void>;
  deleteWallet(id: string): Promise<void>;
  renameWallet(id: string, name: string): Promise<void>;
}

/**
 * Returns the list of wallet roots and wallet mutation actions.
 *
 * `wallets` is empty outside of 'unlocked' and 'active-wallet' phases.
 * Must be called inside a `<KeystoreProvider>`.
 */
export function useKeystoreWallets(): UseKeystoreWalletsReturn {
  const ctx = useKeystoreContext();
  return {
    wallets: ctx.wallets,
    walletCount: ctx.walletCount,
    activeWalletId: ctx.activeWallet?.id ?? null,
    isBusy: ctx.isBusy,
    error: ctx.error,
    activateWallet: ctx.activateWallet,
    addWallet: ctx.addWallet,
    deleteWallet: ctx.deleteWallet,
    renameWallet: ctx.renameWallet,
  };
}
