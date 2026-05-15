import type { ReactNode } from 'react';

export type WalletProviderCardStatus =
  | 'active'
  | 'connecting'
  | 'detecting'
  | 'in-activating'
  | 'in-detecting'
  | 'not-active'
  | 'not-installed'
  | (string & {});

export interface WalletProviderCardProps {
  account?: string | null;
  actions?: ReactNode;
  chainLabel?: string | null;
  className?: string;
  connectLabel?: string;
  connectPending?: boolean;
  error?: string | null;
  onConnect?: () => void;
  onDisconnect?: () => void;
  providerDescription: string;
  providerPresent?: boolean;
  space: 'core' | 'espace';
  status?: WalletProviderCardStatus;
  title: string;
}

function joinClasses(...classNames: Array<string | undefined | false>): string {
  return classNames.filter(Boolean).join(' ');
}

function statusClassName(status: WalletProviderCardStatus | undefined): string {
  if (status === 'active') return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200';
  if (status === 'not-installed') return 'border-red-500/30 bg-red-500/10 text-red-200';
  if (
    status === 'connecting' ||
    status === 'detecting' ||
    status === 'in-activating' ||
    status === 'in-detecting'
  ) {
    return 'border-amber-500/30 bg-amber-500/10 text-amber-200';
  }
  return 'border-slate-700 bg-slate-800 text-slate-300';
}

function statusLabel(status: WalletProviderCardStatus | undefined): string {
  switch (status) {
    case 'active':
      return 'active';
    case 'connecting':
    case 'in-activating':
      return 'connecting';
    case 'detecting':
    case 'in-detecting':
      return 'detecting';
    case 'not-installed':
      return 'not installed';
    case 'not-active':
      return 'ready';
    default:
      return status ?? 'status';
  }
}

export function WalletProviderCard({
  account,
  actions,
  chainLabel,
  className,
  connectLabel,
  connectPending = false,
  error,
  onConnect,
  onDisconnect,
  providerDescription,
  providerPresent,
  space,
  status,
  title,
}: WalletProviderCardProps) {
  const isActive = status === 'active';
  const isNotInstalled = status === 'not-installed';
  const shouldShowConnect = !isActive && !isNotInstalled && !actions && onConnect;
  const shouldShowDisconnect = isActive && !actions && onDisconnect;

  return (
    <div
      className={joinClasses(
        'rounded-2xl border border-slate-800 bg-slate-900 p-4 text-slate-100 shadow-sm',
        isActive && 'border-emerald-500/20 bg-emerald-500/5',
        isNotInstalled && 'border-red-500/20 bg-red-500/5',
        className,
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span
              className={joinClasses(
                'inline-flex rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em]',
                space === 'core' ? 'bg-cyan-500/10 text-cyan-200' : 'bg-blue-500/10 text-blue-200',
              )}
            >
              {space === 'core' ? 'Core' : 'eSpace'}
            </span>
            <p className="text-sm font-semibold text-slate-50">{title}</p>
          </div>
          <p className="text-xs leading-5 text-slate-400">{providerDescription}</p>
        </div>
        <span
          className={joinClasses(
            'inline-flex rounded-full border px-2 py-1 text-[10px] font-medium uppercase tracking-[0.18em]',
            statusClassName(status),
          )}
        >
          {statusLabel(status)}
        </span>
      </div>

      {providerPresent === undefined ? null : (
        <p className="mb-3 text-xs text-slate-400">
          provider: {providerPresent ? 'detected' : 'not detected'}
        </p>
      )}

      {isActive && account ? (
        <div className="mb-3 rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-xs text-slate-200">
          <p className="break-all">{account}</p>
          {chainLabel ? <p className="mt-1 text-slate-400">chain: {chainLabel}</p> : null}
        </div>
      ) : null}

      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}

      {shouldShowConnect ? (
        <button
          type="button"
          disabled={connectPending}
          onClick={onConnect}
          className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-blue-400"
        >
          {connectPending ? 'Connecting…' : (connectLabel ?? `Connect ${title}`)}
        </button>
      ) : null}

      {shouldShowDisconnect ? (
        <button
          type="button"
          onClick={onDisconnect}
          className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-100 transition-colors hover:border-slate-500 hover:bg-slate-800"
        >
          Disconnect
        </button>
      ) : null}

      {isNotInstalled ? (
        <p className="mt-3 text-xs text-red-300">Provider is not available in this browser.</p>
      ) : null}

      {error ? <p className="mt-3 text-xs text-red-300">{error}</p> : null}
    </div>
  );
}
