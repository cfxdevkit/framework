'use client';

import { WalletPickerModal, WalletStatusChip } from '@cfxdevkit/example-showcase-ui';
import { useCoreWallet } from '@cfxdevkit/wallet-connect/hooks';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { useAccount, useDisconnect } from 'wagmi';
import { useWalletSessions } from './wallet-session-context';

const NAV = [
  { label: 'Core', href: '/core' },
  { label: 'Wallet', href: '/wallet' },
  { label: 'Keys & Signers', href: '/keys' },
  { label: 'SIWE', href: '/siwe' },
  { label: 'DeFi', href: '/defi' },
  { label: 'UI Kit', href: '/ui-kit' },
];

const BTN_BASE: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '6px 12px',
  borderRadius: 'var(--cfx-radius-md)',
  fontSize: 'var(--cfx-text-sm)',
  fontWeight: 500,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'var(--cfx-color-border-default)',
};

const BTN_CONNECT: React.CSSProperties = {
  ...BTN_BASE,
  background: 'var(--cfx-color-brand-primary)',
  color: 'var(--cfx-color-fg-on-brand)',
  borderColor: 'transparent',
};

const BTN_CONNECTED: React.CSSProperties = {
  ...BTN_BASE,
  background: 'var(--cfx-color-bg-emphasis)',
  color: 'var(--cfx-color-fg-default)',
};

/** Full-page layout used by every showcase page. Provides sticky header with
 *  client-side nav (Next.js Link — no full-page reloads) and two wallet
 *  connect buttons: one for eSpace (wagmi / MetaMask) and one for Core (Fluent). */
export function SiteLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [espaceOpen, setEspaceOpen] = useState(false);
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const core = useCoreWallet();
  const { activeSession, removeSession } = useWalletSessions();

  const signerEspaceAddress = activeSession?.addresses.eSpace;
  const signerCoreAddress = activeSession?.addresses.core;

  function disconnectActiveSigner() {
    if (activeSession) removeSession(activeSession.id);
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        background: 'var(--cfx-color-bg-default)',
        color: 'var(--cfx-color-fg-default)',
        fontFamily: 'var(--cfx-font-sans)',
      }}
    >
      {/* ── Header ── */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 var(--cfx-space-6)',
          height: 56,
          background: 'var(--cfx-color-bg-subtle)',
          borderBottom: '1px solid var(--cfx-color-border-default)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
          gap: 'var(--cfx-space-4)',
        }}
      >
        {/* Brand + Nav */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--cfx-space-6)',
            minWidth: 0,
            flex: 1,
            overflow: 'hidden',
          }}
        >
          <Link
            href="/"
            style={{
              fontWeight: 700,
              fontSize: 'var(--cfx-text-base)',
              color: 'var(--cfx-color-fg-default)',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              letterSpacing: '-0.02em',
            }}
          >
            Conflux Showcase
          </Link>

          <nav
            style={{
              display: 'flex',
              gap: 'var(--cfx-space-1)',
              overflowX: 'auto',
              scrollbarWidth: 'none',
            }}
          >
            {NAV.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    fontSize: 'var(--cfx-text-sm)',
                    color: active ? 'var(--cfx-color-fg-default)' : 'var(--cfx-color-fg-subtle)',
                    textDecoration: 'none',
                    padding: 'var(--cfx-space-1) var(--cfx-space-2)',
                    borderRadius: 'var(--cfx-radius-sm)',
                    background: active ? 'var(--cfx-color-bg-emphasis)' : 'transparent',
                    fontWeight: active ? 600 : 400,
                    whiteSpace: 'nowrap',
                    transition: 'color 0.15s, background 0.15s',
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Wallet buttons: eSpace + Core */}
        <div
          style={{
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--cfx-space-2)',
          }}
        >
          {/* eSpace (wagmi / MetaMask) */}
          {isConnected && address ? (
            <button
              type="button"
              onClick={() => disconnect()}
              title="Click to disconnect eSpace"
              style={BTN_CONNECTED}
            >
              <WalletStatusChip address={address} className="pointer-events-none" />
            </button>
          ) : signerEspaceAddress ? (
            <button
              type="button"
              onClick={disconnectActiveSigner}
              title={`Click to disconnect ${activeSession?.label ?? 'hardware signer'}`}
              style={BTN_CONNECTED}
            >
              <WalletStatusChip address={signerEspaceAddress} className="pointer-events-none" />
            </button>
          ) : (
            <button type="button" onClick={() => setEspaceOpen(true)} style={BTN_CONNECT}>
              eSpace
            </button>
          )}

          {/* Core (Fluent window.conflux) */}
          {core.isConnected && core.address ? (
            <button
              type="button"
              onClick={() => core.disconnect()}
              title="Click to disconnect Core"
              style={BTN_CONNECTED}
            >
              <WalletStatusChip address={core.address} className="pointer-events-none" />
            </button>
          ) : signerCoreAddress ? (
            <button
              type="button"
              onClick={disconnectActiveSigner}
              title={`Click to disconnect ${activeSession?.label ?? 'hardware signer'}`}
              style={BTN_CONNECTED}
            >
              <WalletStatusChip address={signerCoreAddress} className="pointer-events-none" />
            </button>
          ) : core.status === 'not-installed' ? null : core.status === 'detecting' ? null : (
            <button
              type="button"
              onClick={() => core.connect()}
              disabled={core.isConnecting}
              style={BTN_CONNECT}
            >
              {core.isConnecting ? 'Connecting…' : 'Core'}
            </button>
          )}

          {/* eSpace wallet picker */}
          <WalletPickerModal
            open={espaceOpen}
            onClose={() => setEspaceOpen(false)}
            section="espace"
          />
        </div>
      </header>

      {/* ── Main content ── */}
      <div
        style={{
          flex: 1,
          padding: 'var(--cfx-space-6)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--cfx-space-4)',
          maxWidth: 1024,
          margin: '0 auto',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        {children}
      </div>
    </div>
  );
}
