'use client';

import { useKeystoreContext } from './context.js';
import type { DualChainIdentity } from './types.js';

export type { DualChainIdentity };

export interface UseKeystoreIdentityReturn {
  /**
   * The normalized dual-chain identity for the currently selected wallet +
   * account. `null` when the keystore is blank, locked, unlocked-but-no-active-
   * wallet, or still loading.
   */
  identity: DualChainIdentity | null;
  /** `true` when a complete dual-chain identity is available. */
  hasIdentity: boolean;
}

/**
 * Returns the normalized dual-chain identity (both eSpace and Core addresses
 * with derivation paths) for the currently active wallet root and account.
 *
 * Both addresses are always paired — never a single-address abstraction.
 *
 * Must be called inside a `<KeystoreProvider>`.
 */
export function useKeystoreIdentity(): UseKeystoreIdentityReturn {
  const { identity } = useKeystoreContext();
  return {
    identity,
    hasIdentity: identity !== null,
  };
}
