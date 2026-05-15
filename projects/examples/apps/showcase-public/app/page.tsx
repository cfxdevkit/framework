'use client';

import { DemoCard } from '@cfxdevkit/example-showcase-ui';
import Link from 'next/link';
import { SiteLayout } from './site-layout';

const CHAPTERS = [
  {
    href: '/core',
    title: 'Core',
    description: 'RPC client, chain listing, address codec, unit formatting.',
  },
  {
    href: '/wallet',
    title: 'Wallet',
    description: 'ConnectButton, useAccount, useBalance, chain switching.',
  },
  {
    href: '/keys',
    title: 'Keys',
    description: 'Mnemonic generation, validation, and HD account derivation.',
  },
  {
    href: '/siwe',
    title: 'SIWE',
    description: 'Sign-in with Ethereum: nonce → sign → verify → JWT.',
  },
  {
    href: '/defi',
    title: 'DeFi',
    description: 'TokenPicker, PortfolioTable, SwapWidget (bring your adapter).',
  },
  {
    href: '/ui-kit',
    title: 'UI Kit',
    description: 'ThemeProvider, design tokens, and component catalog.',
  },
];

// biome-ignore lint/style/noDefaultExport: Next.js page requires default export.
export default function HomePage() {
  return (
    <SiteLayout>
      <DemoCard
        title="Conflux Developer Framework"
        description="Interactive examples for every layer of the framework. Connect a wallet, make RPC calls, and explore DeFi components — all against testnet."
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 'var(--cfx-space-4)',
            marginTop: 'var(--cfx-space-4)',
          }}
        >
          {CHAPTERS.map((ch) => (
            <Link
              key={ch.href}
              href={ch.href}
              style={{
                display: 'block',
                padding: 'var(--cfx-space-4)',
                background: 'var(--cfx-color-bg-emphasis)',
                border: '1px solid var(--cfx-color-border-default)',
                borderRadius: 'var(--cfx-radius-md)',
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <div
                style={{
                  fontWeight: 600,
                  marginBottom: 'var(--cfx-space-1)',
                  color: 'var(--cfx-color-fg-default)',
                }}
              >
                {ch.title}
              </div>
              <div style={{ fontSize: 'var(--cfx-text-sm)', color: 'var(--cfx-color-fg-subtle)' }}>
                {ch.description}
              </div>
            </Link>
          ))}
        </div>
      </DemoCard>
    </SiteLayout>
  );
}
