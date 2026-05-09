'use client';

import { useEspaceConnectors } from '@cfxdevkit/wallet-connect/hooks';
import { useEffect } from 'react';

export interface EspaceWalletModalProps {
  open: boolean;
  onClose: () => void;
}

export function EspaceWalletModal({ open, onClose }: EspaceWalletModalProps) {
  const { connectors, connect, isPending, error } = useEspaceConnectors();

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div role="presentation" className="wallet-modal-overlay">
      <button
        type="button"
        aria-label="Close wallet picker"
        className="wallet-modal-backdrop"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="wallet-picker-title"
        className="wallet-modal-dialog"
      >
        <div className="wallet-modal-heading">
          <div>
            <h2 id="wallet-picker-title">Connect eSpace wallet</h2>
            <p>Choose an injected EVM wallet for Conflux eSpace.</p>
          </div>
          <button type="button" className="button" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="wallet-modal-grid">
          {connectors.map((connector) => (
            <button
              key={connector.uid}
              type="button"
              className="wallet-modal-option"
              disabled={isPending}
              onClick={() => connect(connector, { onSuccess: onClose })}
            >
              <strong>{connector.name}</strong>
              <span>{isPending ? 'Connecting...' : 'Connect wallet'}</span>
            </button>
          ))}
          {connectors.length === 0 ? (
            <div className="wallet-modal-empty">No eSpace browser wallet was detected.</div>
          ) : null}
        </div>

        {error ? <div className="wallet-modal-error">{error.message}</div> : null}
      </div>
    </div>
  );
}
