'use client';

import { useKeystoreContext } from '../context.js';
import type { KeystoreAccount, KeystoreActiveWallet } from '../types.js';

export interface UseKeystoreAccountsReturn {
  accounts: KeystoreAccount[];
  activeWallet: KeystoreActiveWallet | null;
  activeAccountIndex: number | null;
  isBusy: boolean;
  error: string | null;
  activateAccount(walletId: string, index: number): Promise<void>;
}

/**
 * Returns the derived accounts for the active wallet root and the
 * action to switch the active account index.
 *
 * Account switching and wallet-root switching are intentionally separate:
 * use `useKeystoreWallets` for wallet-root switching.
 *
 * Must be called inside a `<KeystoreProvider>`.
 */
export function useKeystoreAccounts(): UseKeystoreAccountsReturn {
  const ctx = useKeystoreContext();
  return {
    accounts: ctx.accounts,
    activeWallet: ctx.activeWallet,
    activeAccountIndex: ctx.activeWallet?.activeAccountIndex ?? null,
    isBusy: ctx.isBusy,
    error: ctx.error,
    activateAccount: ctx.activateAccount,
  };
}
