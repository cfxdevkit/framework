import { useState } from 'react';
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
import { GROUPS, PANELS, type PanelMeta } from './panels/registry.js';
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

function Sidebar({ active, onSelect }: { active: string; onSelect: (id: string) => void }) {
  const byGroup: Map<string, PanelMeta[]> = new Map();
  for (const p of PANELS) {
    const list = byGroup.get(p.group) ?? [];
    list.push(p);
    byGroup.set(p.group, list);
  }
  return (
    <nav className="sidebar">
      {GROUPS.map((g) => {
        const panels = byGroup.get(g.id) ?? [];
        if (panels.length === 0) return null;
        return (
          <div key={g.id}>
            <p className="side-group-label">{g.label}</p>
            <ul className="side-list">
              {panels.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    className={p.id === active ? 'side-item active' : 'side-item'}
                    onClick={() => onSelect(p.id)}
                  >
                    {p.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}

function Shell() {
  const [activeId, setActiveId] = useState(PANELS[0]?.id ?? 'devnode');
  const meta = PANELS.find((p) => p.id === activeId);

  return (
    <div className="app">
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
        <Sidebar active={activeId} onSelect={setActiveId} />
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
