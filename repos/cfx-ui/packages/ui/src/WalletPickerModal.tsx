import { useEffect, useMemo } from 'react';
import type { Connector } from 'wagmi';
import { useConnect, useConnectors } from 'wagmi';

import { WalletProviderCard } from './WalletProviderCard.js';

export interface WalletPickerModalProps {
  open: boolean;
  onClose: () => void;
  section?: 'espace' | 'core' | 'all';
}

function connectorKey(connector: Connector): string {
  return `${connector.id}:${connector.name}`.toLowerCase();
}

export function WalletPickerModal({ open, onClose, section = 'espace' }: WalletPickerModalProps) {
  const connectors = useConnectors();
  const { connect, error, isPending } = useConnect();

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose, open]);

  const uniqueConnectors = useMemo(() => {
    const seen = new Set<string>();
    const deduped: Connector[] = [];

    for (const connector of connectors) {
      const key = connectorKey(connector);
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(connector);
    }

    return deduped;
  }, [connectors]);

  if (!open) return null;

  const title =
    section === 'core'
      ? 'Core wallet connection is app-controlled'
      : section === 'all'
        ? 'Choose an eSpace wallet'
        : 'Connect eSpace wallet';

  const description =
    section === 'core'
      ? 'The shared UI picker currently covers wagmi / eSpace connectors. Keep Core wallet actions in your app shell.'
      : 'Pick any injected or EIP-6963-discovered eSpace wallet exposed through wagmi.';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="presentation">
      <button
        type="button"
        aria-label="Close wallet picker"
        className="absolute inset-0 border-0 bg-slate-950/80 p-0 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="wallet-picker-title"
        className="relative z-10 grid w-full max-w-3xl gap-6 rounded-3xl border border-slate-800 bg-slate-900 p-6 text-slate-100 shadow-2xl shadow-black/50"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <h2 id="wallet-picker-title" className="text-xl font-semibold text-slate-50">
              {title}
            </h2>
            <p className="max-w-2xl text-sm leading-6 text-slate-400">{description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-300 transition-colors hover:border-slate-700 hover:bg-slate-800 hover:text-slate-100"
          >
            Close
          </button>
        </div>

        {section === 'core' ? (
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            Use your app-specific Core wallet action alongside the shared eSpace components.
          </div>
        ) : uniqueConnectors.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-6 text-sm text-slate-400">
            No injected eSpace wallets were detected.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {uniqueConnectors.map((connector) => (
              <WalletProviderCard
                key={connector.uid ?? connectorKey(connector)}
                title={connector.name}
                space="espace"
                status="not-active"
                providerPresent={true}
                providerDescription={connector.id}
                actions={
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => {
                      connect(
                        { connector },
                        {
                          onSuccess: () => onClose(),
                        },
                      );
                    }}
                    className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-blue-400"
                  >
                    {isPending ? 'Connecting…' : 'Connect'}
                  </button>
                }
              />
            ))}
          </div>
        )}

        {error ? <p className="text-sm text-red-300">{error.message}</p> : null}
      </div>
    </div>
  );
}
