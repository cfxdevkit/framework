/**
 * ConnectWall — placeholder rendered inside a panel section when the
 * required wallet is not yet connected. Shows a descriptive message and
 * an inline connect button so the user does not have to scroll up to the
 * header.
 */
import type { ReactNode } from 'react';

interface ConnectWallProps {
  /** Section title shown in the wall */
  title: string;
  /**
   * Wallet status from `useStatus()` or a synthetic value:
   *   'active'         → renders children normally
   *   'not-installed'  → shows "not installed" message, no connect button
   *   anything else    → shows connect button
   */
  status: string | undefined;
  /** Human-readable wallet name for button/error labels */
  walletName: string;
  /** Called when user presses the inline connect button */
  onConnect: () => void;
  /** Whether a connection request is currently in flight */
  connecting?: boolean;
  children: ReactNode;
}

export function ConnectWall({
  title,
  status,
  walletName,
  onConnect,
  connecting,
  children,
}: ConnectWallProps) {
  if (status === 'active') return <>{children}</>;

  const notInstalled = status === 'not-installed';
  const isPending = Boolean(connecting) || status === 'in-detecting' || status === 'in-activating';

  return (
    <div className="connect-wall">
      <div className="connect-wall-title">{title}</div>
      {notInstalled ? (
        <p className="connect-wall-desc">{walletName} is not installed in this browser.</p>
      ) : (
        <>
          <p className="connect-wall-desc">
            Connect <strong>{walletName}</strong> to use this section.
          </p>
          <button
            type="button"
            className="primary"
            style={{ padding: '6px 16px', fontSize: 12 }}
            disabled={isPending}
            onClick={onConnect}
          >
            {isPending ? 'Connecting…' : `Connect ${walletName}`}
          </button>
        </>
      )}
    </div>
  );
}
