import { PanelSidebar, ShowcaseNav, useActivePanelState } from '@cfxdevkit/example-showcase-ui';
import { BackendPill } from './components/BackendPill.js';
import { NetworkSelector } from './components/NetworkSelector.js';
import { WalletBar } from './components/WalletBar.js';
import { NetworkProvider } from './contexts/NetworkProvider.js';
import { WagmiProviders } from './contexts/WagmiProviders.js';
import './styles.css';
import { AboutPanel } from './panels/AboutPanel.js';
import { CompilerPanel } from './panels/CompilerPanel.js';
import { ContractPanel } from './panels/ContractPanel.js';
import { DevNodePanel } from './panels/DevNodePanel.js';
import { GROUPS, PANELS } from './panels/registry.js';
import { SessionKeyPanel } from './panels/SessionKeyPanel.js';
import { SiwePanel } from './panels/SiwePanel.js';
import { StatusPanel } from './panels/StatusPanel.js';

function PanelContent({ id }: { id: string }) {
  switch (id) {
    case 'devnode':
      return <DevNodePanel />;
    case 'siwe':
      return <SiwePanel />;
    case 'session-key':
      return <SessionKeyPanel />;
    case 'compiler':
      return <CompilerPanel />;
    case 'contracts':
      return <ContractPanel />;
    case 'status':
      return <StatusPanel />;
    case 'about':
      return <AboutPanel />;
    default:
      return <div className="muted">Unknown panel</div>;
  }
}

function Shell() {
  const fallbackId = PANELS[0]?.id ?? 'devnode';
  const { activeId, select } = useActivePanelState({
    panels: PANELS,
    storageKey: 'showcase-stack.panel',
    fallbackId,
  });
  const meta = PANELS.find((p) => p.id === activeId);

  return (
    <div className="app">
      <ShowcaseNav current="stack" />
      <header className="app-header">
        <div className="brand">
          <strong style={{ fontSize: 15 }}>cfxdevkit</strong>
          <span className="muted" style={{ fontSize: 11 }}>
            showcase-stack
          </span>
        </div>
        <div className="env-bar" style={{ flex: 1, justifyContent: 'flex-end' }}>
          <BackendPill />
          <WalletBar />
          <NetworkSelector />
        </div>
      </header>

      <div className="layout" style={{ marginTop: 24 }}>
        <PanelSidebar groups={GROUPS} panels={PANELS} active={activeId} onSelect={select} />
        <main className="content">
          {meta && (
            <div className="panel-head">
              <h2>{meta.label}</h2>
              <p className="panel-blurb">{meta.blurb}</p>
            </div>
          )}
          <PanelContent id={activeId} />
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
