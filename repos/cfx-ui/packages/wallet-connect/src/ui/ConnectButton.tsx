import { useEffect, useState } from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import { WalletPickerModal } from './WalletPickerModal.js';

export interface ConnectButtonProps {
  /** Override the "Connect Wallet" label */
  connectLabel?: string;
  /** Called after a successful connection */
  onConnect?: (address: string) => void;
  /** Called after disconnect */
  onDisconnect?: () => void;
  style?: React.CSSProperties;
  className?: string;
}

function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

const baseStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '8px 16px',
  borderRadius: '8px',
  fontSize: '14px',
  fontWeight: 500,
  cursor: 'pointer',
  border: 'none',
  transition: 'background 0.15s',
};

const connectStyle: React.CSSProperties = {
  ...baseStyle,
  background: 'var(--cfx-color-brand-primary, #3b82f6)',
  color: 'var(--cfx-color-fg-on-brand, #fff)',
};

const connectedStyle: React.CSSProperties = {
  ...baseStyle,
  background: 'var(--cfx-color-bg-subtle, #1a2235)',
  color: 'var(--cfx-color-fg-default, #eef3fb)',
  border: '1px solid var(--cfx-color-border-default, rgba(84, 112, 160, 0.35))',
};

/**
 * Wallet connect / disconnect button.
 *
 * - When no wallet is connected, renders a "Connect Wallet" button that opens
 *   the `WalletPickerModal`.
 * - When connected, renders a truncated address button that disconnects on click.
 *
 * @example
 * ```tsx
 * <ConnectButton onConnect={(addr) => console.log('connected', addr)} />
 * ```
 */
export function ConnectButton({
  connectLabel = 'Connect Wallet',
  onConnect,
  onDisconnect,
  style,
  className,
}: ConnectButtonProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  // Notify caller when wallet connects
  useEffect(() => {
    if (isConnected && address) {
      setModalOpen(false);
      onConnect?.(address);
    }
  }, [isConnected, address, onConnect]);

  if (isConnected && address) {
    return (
      <button
        type="button"
        style={{ ...connectedStyle, ...style }}
        className={className}
        onClick={() => {
          disconnect();
          onDisconnect?.();
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: 'var(--cfx-color-feedback-success, #0a7c42)',
            display: 'inline-block',
          }}
        />
        {truncateAddress(address)}
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        style={{ ...connectStyle, ...style }}
        className={className}
        onClick={() => setModalOpen(true)}
      >
        {connectLabel}
      </button>
      <WalletPickerModal open={modalOpen} onClose={() => setModalOpen(false)} section="espace" />
    </>
  );
}
