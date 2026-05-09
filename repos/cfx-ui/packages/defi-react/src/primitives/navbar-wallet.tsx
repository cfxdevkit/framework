/**
 * `@cfxdevkit/defi-react/primitives` — wallet action buttons for AppNavBar.
 *
 * @internal Part of the primitives barrel. Import from
 * `@cfxdevkit/defi-react/primitives` rather than this file.
 */

import type { CSSProperties } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────

export interface NavWalletActionsProps {
  isConnected: boolean;
  address?: string;
  isSignedIn?: boolean;
  isSigning?: boolean;
  wrongNetwork?: boolean;
  isSwitchingNetwork?: boolean;
  error?: string | null;
  onConnect?: () => void;
  onSignIn?: () => void;
  onSignOut?: () => void;
  onSwitchNetwork?: () => void;
  style?: CSSProperties;
}

// ── Styles ────────────────────────────────────────────────────────────────

const BTN_BASE: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '6px 14px',
  borderRadius: 'var(--cfx-radius-sm, 4px)',
  fontSize: 'var(--cfx-text-sm, 13px)',
  fontWeight: 500,
  border: '1px solid var(--cfx-color-border, rgba(0,0,0,0.15))',
  cursor: 'pointer',
  background: 'transparent',
  color: 'var(--cfx-color-fg, #111)',
  transition: 'opacity 0.15s',
};

const BTN_PRIMARY: CSSProperties = {
  ...BTN_BASE,
  background: 'var(--cfx-color-accent, #2563eb)',
  color: '#fff',
  border: 'none',
};

// ── Component ─────────────────────────────────────────────────────────────

/**
 * Pre-wired wallet action buttons for use in the `actions` slot of `AppNavBar`.
 * Handles the common: wrong-network → switch; disconnected → connect;
 * connected-but-unsigned → sign-in; signed-in → sign-out flow.
 *
 * @example
 * ```tsx
 * <AppNavBar
 *   ...
 *   actions={
 *     <NavWalletActions
 *       isConnected={isConnected}
 *       address={address}
 *       isSignedIn={!!token}
 *       wrongNetwork={wrongChain}
 *       onConnect={() => setModalOpen(true)}
 *       onSignIn={login}
 *       onSignOut={() => { logout(); disconnect(); }}
 *       onSwitchNetwork={() => switchChain({ chainId })}
 *     />
 *   }
 * />
 * ```
 */
export function NavWalletActions({
  isConnected,
  address,
  isSignedIn,
  isSigning,
  wrongNetwork,
  isSwitchingNetwork,
  error,
  onConnect,
  onSignIn,
  onSignOut,
  onSwitchNetwork,
  style,
}: NavWalletActionsProps) {
  const short = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Connected';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, ...style }}>
      {error ? (
        <span
          style={{
            fontSize: 'var(--cfx-text-xs, 11px)',
            color: 'var(--cfx-color-feedback-danger, #e53e3e)',
          }}
        >
          {error}
        </span>
      ) : null}

      {wrongNetwork && onSwitchNetwork ? (
        <button
          type="button"
          style={{ ...BTN_BASE, opacity: isSwitchingNetwork ? 0.6 : 1 }}
          disabled={isSwitchingNetwork}
          onClick={onSwitchNetwork}
        >
          {isSwitchingNetwork ? 'Switching…' : 'Switch network'}
        </button>
      ) : null}

      {!isConnected ? (
        <button type="button" style={BTN_PRIMARY} onClick={onConnect}>
          Connect
        </button>
      ) : isSignedIn ? (
        <button type="button" style={BTN_BASE} onClick={onSignOut}>
          {short}
        </button>
      ) : (
        <button
          type="button"
          style={{ ...BTN_PRIMARY, opacity: isSigning ? 0.6 : 1 }}
          disabled={isSigning}
          onClick={onSignIn}
        >
          {isSigning ? 'Signing…' : 'Sign in'}
        </button>
      )}
    </div>
  );
}
