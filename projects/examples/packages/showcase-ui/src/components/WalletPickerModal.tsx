/**
 * WalletPickerModal — discovery and connection chooser.
 *
 * Aggregates two flavours of "available wallet":
 *
 *   1. **eSpace / EVM** — anything wagmi sees through `useConnectors()`.
 *      With wagmi 2's `injected({ shimDisconnect: true })` plus the
 *      built-in EIP-6963 multi-injected discovery, every wallet that
 *      announces itself (MetaMask, Fluent eSpace, Rabby, OKX, Brave,
 *      Frame, Trust, …) shows up here as a separate connector with
 *      `connector.icon` and `connector.name`. Falling back, the bare
 *      `injected` connector still shows so the user can connect
 *      whatever lives on `window.ethereum`.
 *
 *   2. **Core** — `window.conflux` (Fluent's Core-space provider).
 *      wagmi can't speak `cfx_*`, so we surface Core as a parallel
 *      track that drives `window.conflux` directly.
 *
 * Click handlers route to the right stack. Closing the modal happens on
 * backdrop click, Escape, or successful connection.
 */
import { useEffect, useState } from 'react';
import type { Connector } from 'wagmi';
import { useConnect, useConnectors } from 'wagmi';
import { errMsg } from '../lib/err.js';
import {
  getFluentCoreProvider,
  rpcRequestCoreAccounts,
  useCoreWallet,
} from '../lib/use-core-wallet.js';

interface WalletPickerModalProps {
  open: boolean;
  onClose: () => void;
  /** Which sections to render. Defaults to 'espace' — eSpace/EVM only. */
  section?: 'espace' | 'core' | 'all';
}

export function WalletPickerModal({ open, onClose, section = 'espace' }: WalletPickerModalProps) {
  const connectors = useConnectors();
  const { connect, isPending, error } = useConnect();
  const {
    status: coreStatus,
    isConnected: coreIsConnected,
    isConnecting: coreIsConnecting,
  } = useCoreWallet();
  const [coreError, setCoreError] = useState<string | null>(null);
  const [coreBusy, setCoreBusy] = useState(false);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const connectEspace = (c: Connector) => {
    connect(
      { connector: c },
      {
        onSuccess: () => onClose(),
      },
    );
  };

  const connectCore = async () => {
    setCoreError(null);
    setCoreBusy(true);
    try {
      const provider = getFluentCoreProvider();
      if (!provider) throw new Error('Fluent is not installed');
      await rpcRequestCoreAccounts(provider);
      onClose();
    } catch (e) {
      if ((e as { code?: number })?.code !== 4001) setCoreError(errMsg(e));
    } finally {
      setCoreBusy(false);
    }
  };

  const seen = new Set<string>();
  const espaceList: Connector[] = [];
  for (const c of connectors) {
    const key = (c.id ?? c.name ?? '').toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    espaceList.push(c);
  }

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wallet-picker-title"
    >
      <button
        type="button"
        aria-label="Close wallet picker"
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'transparent',
          border: 0,
          padding: 0,
          cursor: 'default',
        }}
      />
      <div className="modal" role="document" style={{ position: 'relative', zIndex: 1 }}>
        <div className="modal-header">
          <h2 id="wallet-picker-title" style={{ margin: 0, fontSize: 16 }}>
            {section === 'core'
              ? 'Connect Core wallet'
              : section === 'espace'
                ? 'Connect eSpace wallet'
                : 'Choose a wallet'}
          </h2>
          <button type="button" className="secondary" onClick={onClose}>
            ✕
          </button>
        </div>
        <p className="panel-desc" style={{ marginTop: 4 }}>
          {section === 'core'
            ? 'Conflux Core goes through the direct window.conflux connector.'
            : section === 'espace'
              ? 'eSpace wallets go through wagmi (EIP-6963 multi-inject).'
              : 'eSpace wallets go through wagmi. Conflux Core goes through the direct window.conflux connector.'}
        </p>

        {(section === 'espace' || section === 'all') && (
          <>
            {section === 'all' && (
              <h3 style={{ fontSize: 12, color: 'var(--muted)', marginTop: 16, marginBottom: 8 }}>
                eSpace / EVM
              </h3>
            )}
            {espaceList.length === 0 ? (
              <div className="result">No EVM providers detected.</div>
            ) : (
              <div className="modal-grid">
                {espaceList.map((c) => (
                  <button
                    key={c.uid}
                    type="button"
                    className="modal-card"
                    disabled={isPending}
                    onClick={() => connectEspace(c)}
                  >
                    {c.icon ? (
                      <img src={c.icon} alt="" width={40} height={40} />
                    ) : (
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 8,
                          background: 'var(--panel-2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 18,
                        }}
                      >
                        ⛓
                      </div>
                    )}
                    <span style={{ fontSize: 12, fontWeight: 500 }}>{c.name}</span>
                    <span className="muted" style={{ fontSize: 10 }}>
                      {c.id}
                    </span>
                  </button>
                ))}
              </div>
            )}
            {error && (
              <div className="result" style={{ color: 'var(--err)' }}>
                {error.message}
              </div>
            )}
          </>
        )}

        {(section === 'core' || section === 'all') && (
          <>
            {section === 'all' && (
              <h3 style={{ fontSize: 12, color: 'var(--muted)', marginTop: 16, marginBottom: 8 }}>
                Conflux Core
              </h3>
            )}
            <div className="modal-grid">
              <button
                type="button"
                className="modal-card"
                disabled={
                  coreStatus === 'not-installed' || coreBusy || coreIsConnecting || coreIsConnected
                }
                onClick={() => void connectCore()}
                title={
                  coreStatus === 'not-installed' ? 'Fluent is not installed' : 'Connect Core space'
                }
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                    background: 'var(--panel-2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                  }}
                >
                  🌀
                </div>
                <span style={{ fontSize: 12, fontWeight: 500 }}>Fluent (Core)</span>
                <span className="muted" style={{ fontSize: 10 }}>
                  {coreStatus === 'not-installed'
                    ? 'not installed'
                    : coreStatus === 'active'
                      ? 'connected'
                      : 'window.conflux'}
                </span>
              </button>
            </div>
            {coreError && (
              <div className="result" style={{ color: 'var(--err)' }}>
                {coreError}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
