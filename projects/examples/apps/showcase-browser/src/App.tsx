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
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { DualWalletBar } from './components/DualWalletBar.js';
import { NetworkSelector } from './components/NetworkSelector.js';
import { NetworkProvider } from './contexts/NetworkContext.js';
import { WagmiProviders } from './contexts/WagmiProviders.js';
import { GROUPS, getPanel, PANELS, type PanelSpec, panelsByGroup } from './panels/registry.js';

const PARAM = 'panel';
const STORAGE_KEY = 'showcase-browser.panel';
const DEFAULT_PANEL = PANELS[0] as PanelSpec;

function readActivePanel(): string {
  if (typeof window === 'undefined') return DEFAULT_PANEL.id;
  const url = new URLSearchParams(window.location.search).get(PARAM);
  if (url && getPanel(url)) return url;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored && getPanel(stored)) return stored;
  return DEFAULT_PANEL.id;
}

function writeActivePanel(id: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, id);
  const url = new URL(window.location.href);
  url.searchParams.set(PARAM, id);
  window.history.replaceState(null, '', url.toString());
}

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

function Sidebar({ active, onSelect }: { active: string; onSelect: (id: string) => void }) {
  return (
    <aside className="sidebar">
      {GROUPS.map((g) => {
        const panels = panelsByGroup(g.id);
        if (panels.length === 0) return null;
        return (
          <div key={g.id} className="side-group">
            <h3 className="side-group-label">{g.label}</h3>
            <ul className="side-list">
              {panels.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    className={`side-item ${active === p.id ? 'active' : ''}`}
                    onClick={() => onSelect(p.id)}
                  >
                    <span>{p.label}</span>
                    <StackBadge stack={p.stack} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </aside>
  );
}

function Shell() {
  const [activeId, setActiveId] = useState<string>(() => readActivePanel());
  const active = useMemo(() => getPanel(activeId) ?? DEFAULT_PANEL, [activeId]);

  const select = useCallback((id: string) => {
    setActiveId(id);
    writeActivePanel(id);
  }, []);

  useEffect(() => {
    writeActivePanel(activeId);
  }, [activeId]);

  const Active = active.component;

  return (
    <div className="app">
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
        <Sidebar active={activeId} onSelect={select} />
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
