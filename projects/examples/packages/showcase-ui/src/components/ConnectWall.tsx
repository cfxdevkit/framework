import type { ReactNode } from 'react';

export interface ConnectWallProps {
  title?: string;
  /** Wallet connection status — when connected/active, renders children */
  status?: string;
  walletName?: string;
  onConnect?: () => void;
  /** Whether a connection is in progress */
  connecting?: boolean;
  children?: ReactNode;
}

/**
 * Wraps content with a connect prompt when the wallet is not active.
 * @deprecated Prefer explicit connect buttons with WalletPickerModal.
 */
export function ConnectWall({ status, children, title, walletName, onConnect }: ConnectWallProps) {
  const connected = status === 'connected' || status === 'active';
  if (connected) return <>{children}</>;
  return (
    <div
      style={{
        padding: 'var(--cfx-space-4, 16px)',
        border: '1px dashed var(--cfx-color-border-default, rgba(0,0,0,.12))',
        borderRadius: '8px',
        textAlign: 'center',
      }}
    >
      <p style={{ margin: '0 0 8px', opacity: 0.6, fontSize: 13 }}>
        Connect {walletName ?? title ?? 'a wallet'} to continue
      </p>
      {onConnect && (
        <button type="button" onClick={onConnect}>
          Connect
        </button>
      )}
    </div>
  );
}
