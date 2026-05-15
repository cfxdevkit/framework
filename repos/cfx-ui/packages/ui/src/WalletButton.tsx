import { useWalletSession } from '@cfxdevkit/ui-core';

export interface WalletButtonProps {
  className?: string;
  connectLabel?: string;
  connectedClassName?: string;
  disconnectedClassName?: string;
  disconnectLabel?: string;
}

function joinClasses(...classNames: Array<string | undefined>): string {
  return classNames.filter(Boolean).join(' ');
}

function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function WalletButton({
  className,
  connectLabel = 'Connect wallet',
  connectedClassName,
  disconnectedClassName,
  disconnectLabel,
}: WalletButtonProps) {
  const session = useWalletSession();
  const baseClassName =
    'inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition-colors';

  if (session.isConnected && session.address) {
    return (
      <button
        type="button"
        onClick={session.disconnect}
        className={joinClasses(
          baseClassName,
          'border border-slate-700 bg-slate-900 text-slate-100 hover:border-slate-500 hover:bg-slate-800',
          connectedClassName,
          className,
        )}
      >
        {disconnectLabel ?? truncateAddress(session.address)}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={session.connect}
      disabled={session.isConnecting}
      className={joinClasses(
        baseClassName,
        'bg-blue-600 text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-blue-400',
        disconnectedClassName,
        className,
      )}
    >
      {session.isConnecting ? 'Connecting…' : connectLabel}
    </button>
  );
}
