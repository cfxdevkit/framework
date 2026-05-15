'use client';

import { WalletPickerModal } from '@cfxdevkit/example-showcase-ui';
import { useCoreWallet } from '@cfxdevkit/wallet-connect/hooks';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { useAccount, useDisconnect } from 'wagmi';

const NAV = [
  { label: 'Core', href: '/core' },
  { label: 'Wallet', href: '/wallet' },
  { label: 'Keys', href: '/keys' },
  { label: 'SIWE', href: '/siwe' },
  { label: 'DeFi', href: '/defi' },
  { label: 'UI Kit', href: '/ui-kit' },
];

function truncate(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

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

const DOT: React.CSSProperties = {
  width: 7,
  height: 7,
  borderRadius: '50%',
  background: 'var(--cfx-color-feedback-success)',
  display: 'inline-block',
  flexShrink: 0,
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
              <span style={DOT} />
              {truncate(address)}
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
              <span style={DOT} />
              {truncate(core.address)}
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
