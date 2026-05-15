export type WalletStatusChipState = 'connected' | 'connecting' | 'disconnected';

export interface WalletStatusChipProps {
  address?: string | null;
  className?: string;
  status?: WalletStatusChipState;
}

function joinClasses(...classNames: Array<string | undefined>): string {
  return classNames.filter(Boolean).join(' ');
}

function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function WalletStatusChip({
  address,
  className,
  status = 'connected',
}: WalletStatusChipProps) {
  if (!address) return null;

  const toneClassName =
    status === 'connecting'
      ? 'border-amber-500/30 bg-amber-500/10 text-amber-100'
      : status === 'connected'
        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'
        : 'border-slate-700 bg-slate-900 text-slate-100';

  return (
    <div
      className={joinClasses(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium',
        toneClassName,
        className,
      )}
    >
      <span className="h-2 w-2 rounded-full bg-current opacity-80" />
      <span className="font-mono">{truncateAddress(address)}</span>
    </div>
  );
}
