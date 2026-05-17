'use client';

import type { ReactNode } from 'react';

interface ShellHeaderProps {
  network: string;
  onSetNetwork: (net: 'local' | 'testnet' | 'mainnet') => void;
  activeWallet: { name: string } | null | undefined;
  keystoreBadge: ReactNode;
}

export function ShellHeader({
  network,
  onSetNetwork,
  activeWallet,
  keystoreBadge,
}: ShellHeaderProps) {
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        height: '44px',
        borderBottom: '1px solid #2a2a2a',
        backgroundColor: '#111',
        flexShrink: 0,
        gap: '12px',
      }}
    >
      <h1
        style={{
          margin: 0,
          fontSize: '14px',
          fontWeight: 600,
          letterSpacing: '-0.01em',
          color: '#d0d0d0',
        }}
      >
        cfxdevkit &middot; showcase-local
      </h1>
      <div style={{ flex: 1 }} />

      {/* ── Network selector ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
          padding: '3px',
          background: '#1a1a1a',
          borderRadius: '6px',
          border: '1px solid #2a2a2a',
        }}
      >
        {(['local', 'testnet', 'mainnet'] as const).map((net) => (
          <button
            key={net}
            type="button"
            onClick={() => onSetNetwork(net)}
            style={{
              padding: '3px 10px',
              fontSize: '11px',
              fontWeight: network === net ? 600 : 400,
              border: 'none',
              borderRadius: '4px',
              background: network === net ? '#2563eb' : 'transparent',
              color: network === net ? '#fff' : '#555',
              cursor: 'pointer',
            }}
          >
            {net}
          </button>
        ))}
      </div>

      {/* ── Active wallet pill ── */}
      {activeWallet && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '12px',
            color: '#888',
            padding: '3px 8px',
            background: '#1a1a1a',
            borderRadius: '4px',
            border: '1px solid #2a2a2a',
          }}
        >
          <span style={{ color: '#3b82f6', fontSize: '10px' }}>◈</span>
          <span>{activeWallet.name}</span>
        </div>
      )}

      {/* ── Keystore status badge ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>{keystoreBadge}</div>
    </header>
  );
}
