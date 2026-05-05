/**
 * Backend showcase shell.
 *
 *   ┌────────────────────────────────────────────────────────────────────┐
 *   │  Title · NetworkSelector · DevNodePill                            │
 *   ├──────────────┬─────────────────────────────────────────────────────┤
 *   │              │                                                     │
 *   │  Sidebar     │                <active panel>                       │
 *   │  (groups)    │                                                     │
 *   │              │                                                     │
 *   └──────────────┴─────────────────────────────────────────────────────┘
 *
 * This app demonstrates backend-powered operations: Core RPC SDK surface,
 * server-side Solidity compilation + managed-key deployment, and network
 * health inspection. No user-controlled browser wallet is required.
 */
import {
  PanelSidebar,
  SharedDevNodePill,
  ShowcaseNav,
  useActivePanelState,
} from '@cfxdevkit/example-showcase-ui';
import { Suspense, useMemo } from 'react';
import { NetworkSelector } from './components/NetworkSelector.js';
import { WalletPill } from './components/WalletPill.js';
import { CompilerSessionProvider } from './contexts/CompilerSession.js';
import { KeystoreSessionProvider } from './contexts/KeystoreSessionProvider.js';
import { NetworkProvider } from './contexts/NetworkProvider.js';
import { WalletProvider } from './contexts/WalletProvider.js';
import { GROUPS, getPanel, PANELS, type PanelSpec } from './panels/registry.js';

const DEFAULT_PANEL = PANELS[0] as PanelSpec;

function Shell() {
  const { activeId, select } = useActivePanelState({
    panels: PANELS,
    storageKey: 'showcase-backend.panel',
    fallbackId: DEFAULT_PANEL.id,
  });
  const active = useMemo(() => getPanel(activeId) ?? DEFAULT_PANEL, [activeId]);

  const Active = active.component;

  return (
    <div className="app">
      <ShowcaseNav current="showcase" />
      <header className="app-header">
        <div className="brand">
          <h1>cfxdevkit · backend</h1>
          <span className="sub">backend-powered SDK operations · managed key · RPC · compiler</span>
        </div>
        <div className="env-bar">
          <NetworkSelector />
          <SharedDevNodePill />
          <WalletPill />
        </div>
      </header>

      <div className="layout">
        <PanelSidebar groups={GROUPS} panels={PANELS} active={activeId} onSelect={select} />
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
      <KeystoreSessionProvider>
        <WalletProvider>
          <CompilerSessionProvider>
            <Shell />
          </CompilerSessionProvider>
        </WalletProvider>
      </KeystoreSessionProvider>
    </NetworkProvider>
  );
}
