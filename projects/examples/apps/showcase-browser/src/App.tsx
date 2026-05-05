/**
 * Browser-only showcase shell. Pure user-wallet focus — every signing /
 * connecting flow goes through a wallet the user controls (Fluent,
 * MetaMask, any EIP-1193 injected provider). No mnemonic stand-ins, no
 * backend session keys — those live in the sister app
 * `@cfxdevkit/example-showcase-browser-backend` (forthcoming) which
 * combines user wallets with a Node-side issuer.
 *
 *   ┌─────────────────────────────────────────────────────────────────┐
 *   │  cfxdevkit · external wallets         <WalletPill (wagmi)>      │
 *   ├──────────────┬──────────────────────────────────────────────────┤
 *   │  Connect     │                                                  │
 *   │  Use         │            <active panel>                        │
 *   │  Utility     │                                                  │
 *   └──────────────┴──────────────────────────────────────────────────┘
 *
 * Panels are registered in `panels/registry.ts` and lazy-loaded.
 */
import { PanelSidebar, ShowcaseNav, useActivePanelState } from '@cfxdevkit/example-showcase-ui';
import { Suspense, useMemo } from 'react';
import { DualWalletBar } from './components/DualWalletBar.js';
import { NetworkSelector } from './components/NetworkSelector.js';
import { NetworkProvider } from './contexts/NetworkContext.js';
import { WagmiProviders } from './contexts/WagmiProviders.js';
import { GROUPS, getPanel, PANELS, type PanelSpec } from './panels/registry.js';

const STORAGE_KEY = 'showcase-browser.panel';
const DEFAULT_PANEL = PANELS[0] as PanelSpec;

function StackBadge({ stack }: { stack: PanelSpec['stack'] }) {
  const colour =
    stack === 'wagmi'
      ? '#7b61ff'
      : stack === 'use-wallet-react'
        ? '#e8820c'
        : stack === 'window'
          ? '#4cc9f0'
          : '#80ed99';
  return (
    <span
      className="mono"
      style={{
        fontSize: 9,
        padding: '1px 6px',
        borderRadius: 4,
        background: `${colour}22`,
        color: colour,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
      }}
    >
      {stack}
    </span>
  );
}

function Shell() {
  const { activeId, select } = useActivePanelState({
    panels: PANELS,
    storageKey: STORAGE_KEY,
    fallbackId: DEFAULT_PANEL.id,
  });
  const active = useMemo(() => getPanel(activeId) ?? DEFAULT_PANEL, [activeId]);

  const Active = active.component;

  return (
    <div className="app">
      <ShowcaseNav current="browser" />
      <header className="app-header">
        <div className="brand">
          <h1>cfxdevkit · external wallets</h1>
          <span className="sub">
            user-controlled wallets in the browser · Fluent · MetaMask · injected EIP-1193
          </span>
        </div>
        <div className="env-bar">
          <NetworkSelector />
          <DualWalletBar />
        </div>
      </header>

      <div className="layout">
        <PanelSidebar
          groups={GROUPS}
          panels={PANELS}
          active={activeId}
          onSelect={select}
          renderMeta={(panel) => <StackBadge stack={panel.stack} />}
        />
        <main className="content">
          <div className="panel-head">
            <h2>{active.label}</h2>
            <p className="panel-blurb">{active.blurb}</p>
          </div>
          <Suspense fallback={<p className="muted">loading {active.label}…</p>}>
            <Active />
          </Suspense>
        </main>
      </div>
    </div>
  );
}

export function App() {
  return (
    <NetworkProvider>
      <WagmiProviders>
        <Shell />
      </WagmiProviders>
    </NetworkProvider>
  );
}
