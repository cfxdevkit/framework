'use client';

import { useKeystoreContext } from './context.js';
import type { KeystorePhase } from './types.js';

export interface UseKeystoreLifecycleReturn {
  phase: KeystorePhase;
  isLocked: boolean;
  isInitialized: boolean;
  isBusy: boolean;
  error: string | null;
  /**
   * Present when the server reports reset guidance for a stuck keystore.
   * Only show to the user when the keystore appears unrecoverable.
   */
  resetGuidance: {
    paths: string[];
    requiresNodeStop: boolean;
    warning: string;
  } | null;
  setup(passphrase: string): Promise<void>;
  unlock(passphrase: string): Promise<void>;
  lock(): Promise<void>;
  refresh(): Promise<void>;
  clearError(): void;
}

/**
 * Exposes the keystore lifecycle: current phase, busy/error state,
 * and the setup / unlock / lock actions.
 *
 * Must be called inside a `<KeystoreProvider>`.
 */
export function useKeystoreLifecycle(): UseKeystoreLifecycleReturn {
  const ctx = useKeystoreContext();
  return {
    phase: ctx.phase,
    isLocked: ctx.isLocked,
    isInitialized: ctx.isInitialized,
    isBusy: ctx.isBusy,
    error: ctx.error,
    resetGuidance: ctx.resetGuidance,
    setup: ctx.setup,
    unlock: ctx.unlock,
    lock: ctx.lock,
    refresh: ctx.refresh,
    clearError: ctx.clearError,
  };
}

// ── Phase predicates as standalone selectors ──────────────────────────────────

export function useIsKeystoreBlank(): boolean {
  return useKeystoreContext().phase === 'blank';
}

export function useIsKeystoredLocked(): boolean {
  const { phase } = useKeystoreContext();
  return phase === 'blank' || phase === 'locked';
}

export function useIsKeystoreReady(): boolean {
  const { phase } = useKeystoreContext();
  return phase === 'unlocked' || phase === 'active-wallet';
}

export function useIsKeystoreActive(): boolean {
  return useKeystoreContext().phase === 'active-wallet';
}
