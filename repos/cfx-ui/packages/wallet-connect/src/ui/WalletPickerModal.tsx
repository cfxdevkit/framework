import { useEffect, useMemo, useState } from 'react';
import type { Connector } from 'wagmi';
import { useConnect, useConnectors } from 'wagmi';
import { useCoreWallet } from '../hooks/useCoreWallet.js';
import { getFluentCoreProvider, rpcRequestCoreAccounts } from '../lib/coreWalletPrimitives.js';
import { errMsg } from '../lib/err.js';

export interface WalletPickerModalProps {
  open: boolean;
  onClose: () => void;
  section?: 'espace' | 'core' | 'all';
}

const overlayStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(10, 14, 24, 0.74)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 24,
  zIndex: 50,
} as const;

const dialogStyle = {
  position: 'relative',
  zIndex: 1,
  width: 'min(720px, 100%)',
  borderRadius: 20,
  background: '#111824',
  color: '#eef3fb',
  border: '1px solid rgba(84, 112, 160, 0.35)',
  boxShadow: '0 30px 120px rgba(0, 0, 0, 0.45)',
  padding: 20,
  display: 'grid',
  gap: 16,
} as const;

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 12,
} as const;

const buttonCardStyle = {
  borderRadius: 16,
  border: '1px solid rgba(84, 112, 160, 0.35)',
  background: 'rgba(15, 23, 35, 0.9)',
  color: 'inherit',
  padding: 16,
  display: 'grid',
  gap: 8,
  textAlign: 'left',
  cursor: 'pointer',
} as const;

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

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  const espaceList = useMemo(() => {
    const seen = new Set<string>();
    const unique: Connector[] = [];
    for (const connector of connectors) {
      const key = `${connector.id}:${connector.name}`.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(connector);
    }
    return unique;
  }, [connectors]);

  if (!open) return null;

  const connectEspace = (connector: Connector) => {
    connect(
      { connector },
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
    } catch (error) {
      if ((error as { code?: number }).code !== 4001) {
        setCoreError(errMsg(error));
      }
    } finally {
      setCoreBusy(false);
    }
  };

  return (
    <div role="presentation" style={overlayStyle}>
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
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="wallet-picker-title"
        style={dialogStyle}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <h2 id="wallet-picker-title" style={{ margin: 0, fontSize: 20 }}>
              {section === 'core'
                ? 'Connect Core wallet'
                : section === 'espace'
                  ? 'Connect eSpace wallet'
                  : 'Choose a wallet'}
            </h2>
            <p style={{ margin: '6px 0 0', color: '#9eb2d1', lineHeight: 1.5 }}>
              {section === 'core'
                ? 'Conflux Core uses the direct window.conflux provider.'
                : section === 'espace'
                  ? 'eSpace wallets use wagmi with non-Fluent injected discovery.'
                  : 'Pick an eSpace wallet through wagmi or connect Fluent directly for Core space.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              alignSelf: 'flex-start',
              background: 'transparent',
              color: '#9eb2d1',
              border: 0,
              cursor: 'pointer',
              fontSize: 18,
            }}
          >
            x
          </button>
        </div>

        {(section === 'espace' || section === 'all') && (
          <section data-wallet-section="espace">
            {section === 'all' && (
              <h3 style={{ margin: '0 0 10px', fontSize: 12, letterSpacing: '0.12em' }}>
                eSpace / EVM
              </h3>
            )}
            {espaceList.length === 0 ? (
              <div style={{ color: '#9eb2d1' }}>No EVM providers detected.</div>
            ) : (
              <div style={gridStyle}>
                {espaceList.map((connector) => (
                  <button
                    key={connector.uid ?? `${connector.id}:${connector.name}`}
                    type="button"
                    disabled={isPending}
                    onClick={() => connectEspace(connector)}
                    style={buttonCardStyle}
                  >
                    {connector.icon ? (
                      <img src={connector.icon} alt="" width={40} height={40} />
                    ) : (
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 10,
                          display: 'grid',
                          placeItems: 'center',
                          background: 'rgba(26, 38, 56, 0.95)',
                        }}
                      >
                        ⛓
                      </div>
                    )}
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{connector.name}</span>
                    <span style={{ fontSize: 11, color: '#9eb2d1' }}>{connector.id}</span>
                  </button>
                ))}
              </div>
            )}
            {error && <div style={{ color: '#ff8d8d' }}>{error.message}</div>}
          </section>
        )}

        {(section === 'core' || section === 'all') && (
          <section data-wallet-section="core">
            {section === 'all' && (
              <h3 style={{ margin: '0 0 10px', fontSize: 12, letterSpacing: '0.12em' }}>
                Conflux Core
              </h3>
            )}
            <div style={gridStyle}>
              <button
                type="button"
                onClick={() => void connectCore()}
                disabled={
                  coreStatus === 'not-installed' || coreBusy || coreIsConnecting || coreIsConnected
                }
                style={buttonCardStyle}
                title={coreStatus === 'not-installed' ? 'Fluent is not installed' : 'Connect Core'}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    display: 'grid',
                    placeItems: 'center',
                    background: 'rgba(26, 38, 56, 0.95)',
                  }}
                >
                  🌀
                </div>
                <span style={{ fontSize: 13, fontWeight: 600 }}>Fluent (Core)</span>
                <span style={{ fontSize: 11, color: '#9eb2d1' }}>
                  {coreStatus === 'not-installed'
                    ? 'not installed'
                    : coreStatus === 'active'
                      ? 'connected'
                      : 'window.conflux'}
                </span>
              </button>
            </div>
            {coreError && <div style={{ color: '#ff8d8d' }}>{coreError}</div>}
          </section>
        )}
      </div>
    </div>
  );
}
