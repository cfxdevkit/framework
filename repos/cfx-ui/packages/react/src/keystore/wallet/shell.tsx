'use client';

import type { ReactNode } from 'react';
import type { DualChainIdentity, KeystoreAccount, KeystoreWallet } from '../types.js';
import { useKeystoreAccounts } from '../use-keystore/accounts.js';
import { useKeystoreIdentity } from '../use-keystore/identity.js';
import { useKeystoreLifecycle } from '../use-keystore/lifecycle.js';
import { useKeystoreWallets } from '../use-keystore/wallets.js';

// ── KeystoreShell ─────────────────────────────────────────────────────────────

export interface KeystoreShellProps {
  /**
   * Rendered when the keystore has never been initialized (phase='blank').
   * Receives the `setup` action so the surface can call it directly.
   */
  blankSlot: (props: {
    setup: (passphrase: string) => Promise<void>;
    isBusy: boolean;
    error: string | null;
  }) => ReactNode;
  /**
   * Rendered when the keystore is initialized but locked (phase='locked').
   * Receives the `unlock` action.
   */
  lockedSlot: (props: {
    unlock: (passphrase: string) => Promise<void>;
    isBusy: boolean;
    error: string | null;
  }) => ReactNode;
  /**
   * Rendered when unlocked with an active wallet. Typically wraps the
   * identity strip and any content panels.
   */
  activeSlot: ReactNode;
  /**
   * Optional: shown in unlocked phase when no active wallet has been
   * selected yet (phase='unlocked' but no active-wallet).
   */
  noWalletSlot?: ReactNode;
}

/**
 * Top-level keystore shell gating component.
 *
 * Renders one of four states based on the keystore phase, delegating
 * the UI shape entirely to the caller. The component itself is styling-
 * agnostic — pass render-prop slots for each surface.
 *
 * Must be used inside a `<KeystoreProvider>`.
 */
export function KeystoreShell({
  blankSlot,
  lockedSlot,
  activeSlot,
  noWalletSlot,
}: KeystoreShellProps) {
  const { phase, isBusy, error, setup, unlock } = useKeystoreLifecycle();

  if (phase === 'blank') {
    return <>{blankSlot({ setup, isBusy, error })}</>;
  }
  if (phase === 'locked') {
    return <>{lockedSlot({ unlock, isBusy, error })}</>;
  }
  if (phase === 'unlocked') {
    return <>{noWalletSlot ?? null}</>;
  }
  // phase === 'active-wallet'
  return <>{activeSlot}</>;
}

// ── KeystoreIdentityStrip ─────────────────────────────────────────────────────

export interface KeystoreIdentityStripProps {
  /**
   * Render the eSpace address field.
   * Receives the full identity so the caller can format/truncate as needed.
   */
  espaceSlot: (identity: DualChainIdentity) => ReactNode;
  /**
   * Render the Core address field.
   */
  coreSlot: (identity: DualChainIdentity) => ReactNode;
  /**
   * Render the wallet-switcher trigger (a button or label that opens the
   * wallet dropdown when clicked). Receives the active wallet name.
   */
  walletTriggerSlot: (props: { walletName: string; onClick: () => void }) => ReactNode;
  /**
   * Render the account-switcher trigger. Receives the active account index.
   */
  accountTriggerSlot: (props: { accountIndex: number; onClick: () => void }) => ReactNode;
  /**
   * Render the wallet dropdown overlay when `isWalletOpen` is true.
   * Use `<KeystoreWalletSwitcher>` here.
   */
  walletSwitcherSlot?: (props: { isOpen: boolean; onClose: () => void }) => ReactNode;
  /**
   * Render the account dropdown overlay when `isAccountOpen` is true.
   * Use `<KeystoreAccountSwitcher>` here.
   */
  accountSwitcherSlot?: (props: { isOpen: boolean; onClose: () => void }) => ReactNode;
  /**
   * Optional portfolio slot. Receives the identity so a balance component
   * can be added without coupling the strip to balance fetching.
   */
  portfolioSlot?: (identity: DualChainIdentity) => ReactNode;
  /**
   * Called when the lock button is pressed.
   */
  onLock?: () => void;
  isWalletOpen: boolean;
  isAccountOpen: boolean;
  onWalletOpen: () => void;
  onWalletClose: () => void;
  onAccountOpen: () => void;
  onAccountClose: () => void;
}

/**
 * Persistent identity strip — the always-visible anchor when the keystore
 * is in the 'active-wallet' phase.
 *
 * Renders:
 * - The current wallet-root trigger (opens wallet-switcher overlay)
 * - The current account trigger (opens account-switcher overlay)
 * - Both eSpace and Core address fields
 * - An optional portfolio slot
 * - An optional lock button callback
 *
 * Wallet-root switching and account-index switching are explicitly kept
 * as separate controls — they must never be collapsed into one.
 *
 * Must be used inside a `<KeystoreProvider>`.
 */
export function KeystoreIdentityStrip({
  espaceSlot,
  coreSlot,
  walletTriggerSlot,
  accountTriggerSlot,
  walletSwitcherSlot,
  accountSwitcherSlot,
  portfolioSlot,
  onLock,
  isWalletOpen,
  isAccountOpen,
  onWalletOpen,
  onWalletClose,
  onAccountOpen,
  onAccountClose,
}: KeystoreIdentityStripProps) {
  const { identity } = useKeystoreIdentity();

  if (!identity) return null;

  return (
    <>
      {walletTriggerSlot({ walletName: identity.walletName, onClick: onWalletOpen })}
      {walletSwitcherSlot?.({ isOpen: isWalletOpen, onClose: onWalletClose })}

      {accountTriggerSlot({ accountIndex: identity.accountIndex, onClick: onAccountOpen })}
      {accountSwitcherSlot?.({ isOpen: isAccountOpen, onClose: onAccountClose })}

      {espaceSlot(identity)}
      {coreSlot(identity)}

      {portfolioSlot?.(identity)}

      {onLock && (
        <button type="button" onClick={onLock}>
          Lock
        </button>
      )}
    </>
  );
}

// ── KeystoreWalletSwitcher ────────────────────────────────────────────────────

export interface KeystoreWalletSwitcherProps {
  /** Called when the overlay should be dismissed. */
  onClose: () => void;
  /** Render each wallet entry. Return a button/row; the component handles layout. */
  walletRowSlot: (props: {
    wallet: KeystoreWallet;
    isActive: boolean;
    onActivate: () => void;
  }) => ReactNode;
  /**
   * Optional slot to render a "Create / Import wallet" form below the list.
   */
  addWalletSlot?: ReactNode;
}

/**
 * Headless wallet-root switcher overlay.
 *
 * Renders a list of wallet roots via `walletRowSlot` and an optional
 * add-wallet form. Wallet-root switching is separate from account switching —
 * selecting a wallet root here does NOT also pick an account.
 *
 * Must be used inside a `<KeystoreProvider>`.
 */
export function KeystoreWalletSwitcher({
  onClose,
  walletRowSlot,
  addWalletSlot,
}: KeystoreWalletSwitcherProps) {
  const { wallets, activeWalletId, activateWallet } = useKeystoreWallets();

  return (
    <>
      {wallets.map((wallet) =>
        walletRowSlot({
          wallet,
          isActive: wallet.id === activeWalletId,
          onActivate: async () => {
            await activateWallet(wallet.id);
            onClose();
          },
        }),
      )}
      {addWalletSlot}
    </>
  );
}

// ── KeystoreAccountSwitcher ───────────────────────────────────────────────────

export interface KeystoreAccountSwitcherProps {
  /** Called when the overlay should be dismissed. */
  onClose: () => void;
  /** Render each account entry. Both eSpace and Core fields are provided. */
  accountRowSlot: (props: {
    account: KeystoreAccount;
    isActive: boolean;
    onActivate: () => void;
  }) => ReactNode;
}

/**
 * Headless account-index switcher overlay.
 *
 * Renders the derived accounts for the active wallet root via `accountRowSlot`.
 * Each account always carries both `espaceAddress` and `coreAddress` — the
 * dual-chain identity is never collapsed to a single address here.
 *
 * Account switching is separate from wallet-root switching — selecting an
 * account index here does NOT change the wallet root.
 *
 * Must be used inside a `<KeystoreProvider>`.
 */
export function KeystoreAccountSwitcher({ onClose, accountRowSlot }: KeystoreAccountSwitcherProps) {
  const { accounts, activeWallet, activateAccount } = useKeystoreAccounts();

  if (!activeWallet) return null;

  return (
    <>
      {accounts.map((account) =>
        accountRowSlot({
          account,
          isActive: account.active,
          onActivate: async () => {
            await activateAccount(activeWallet.id, account.index);
            onClose();
          },
        }),
      )}
    </>
  );
}
