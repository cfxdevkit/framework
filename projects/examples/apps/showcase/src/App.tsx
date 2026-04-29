import { useState } from 'react';
import { AboutPanel } from './panels/AboutPanel.js';
import { DerivePanel } from './panels/DerivePanel.js';
import { MnemonicPanel } from './panels/MnemonicPanel.js';
import { StatusPanel } from './panels/StatusPanel.js';

type Tab = 'mnemonic' | 'derive' | 'status' | 'about';

const TABS: { id: Tab; label: string }[] = [
  { id: 'mnemonic', label: 'Mnemonic' },
  { id: 'derive', label: 'Derive' },
  { id: 'status', label: 'Network Status' },
  { id: 'about', label: 'About' },
];

export function App() {
  const [tab, setTab] = useState<Tab>('mnemonic');
  return (
    <div className="app">
      <header className="app-header">
        <h1>cfxdevkit · showcase</h1>
        <span className="sub">@cfxdevkit/core live demo</span>
      </header>

      <nav className="tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={tab === t.id ? 'active' : ''}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === 'mnemonic' && <MnemonicPanel />}
      {tab === 'derive' && <DerivePanel />}
      {tab === 'status' && <StatusPanel />}
      {tab === 'about' && <AboutPanel />}
    </div>
  );
}
