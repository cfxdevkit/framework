import { useState } from 'react';
import { ChainProvider, useChain } from './contexts/ChainProvider.js';
import { WalletProvider } from './contexts/WalletProvider.js';
import { AboutPanel } from './panels/AboutPanel.js';
import { ContractPanel } from './panels/ContractPanel.js';
import { CorePanel } from './panels/CorePanel.js';
import { DerivePanel } from './panels/DerivePanel.js';
import { KeystorePanel } from './panels/KeystorePanel.js';
import { MnemonicPanel } from './panels/MnemonicPanel.js';
import { SessionKeyPanel } from './panels/SessionKeyPanel.js';
import { SiwePanel } from './panels/SiwePanel.js';
import { StatusPanel } from './panels/StatusPanel.js';
import { WalletPanel } from './panels/WalletPanel.js';

type Tab =
  | 'wallet'
  | 'mnemonic'
  | 'derive'
  | 'keystore'
  | 'siwe'
  | 'session-key'
  | 'contract'
  | 'core'
  | 'status'
  | 'about';

const TABS: { id: Tab; label: string }[] = [
  { id: 'wallet', label: 'Wallet' },
  { id: 'mnemonic', label: 'Mnemonic' },
  { id: 'derive', label: 'Derive' },
  { id: 'keystore', label: 'Keystore' },
  { id: 'siwe', label: 'SIWE' },
  { id: 'session-key', label: 'Session Key' },
  { id: 'contract', label: 'Contract' },
  { id: 'core', label: 'Core Space' },
  { id: 'status', label: 'Network' },
  { id: 'about', label: 'About' },
];

function ChainSelector() {
  const { chains, chain, setChainName } = useChain();
  return (
    <label className="row" style={{ alignItems: 'center', gap: 6 }}>
      <span className="muted" style={{ fontSize: 12 }}>
        chain
      </span>
      <select value={chain.name} onChange={(e) => setChainName(e.target.value)}>
        {chains.map((c) => (
          <option key={c.name} value={c.name}>
            {c.displayName} · {c.family} ({c.id})
          </option>
        ))}
      </select>
    </label>
  );
}

export function App() {
  const [tab, setTab] = useState<Tab>('wallet');
  return (
    <ChainProvider>
      <WalletProvider>
        <div className="app">
          <header className="app-header">
            <div>
              <h1>cfxdevkit · showcase</h1>
              <span className="sub">@cfxdevkit/* live demo + integration harness</span>
            </div>
            <ChainSelector />
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

          {tab === 'wallet' && <WalletPanel />}
          {tab === 'mnemonic' && <MnemonicPanel />}
          {tab === 'derive' && <DerivePanel />}
          {tab === 'keystore' && <KeystorePanel />}
          {tab === 'siwe' && <SiwePanel />}
          {tab === 'session-key' && <SessionKeyPanel />}
          {tab === 'contract' && <ContractPanel />}
          {tab === 'core' && <CorePanel />}
          {tab === 'status' && <StatusPanel />}
          {tab === 'about' && <AboutPanel />}
        </div>
      </WalletProvider>
    </ChainProvider>
  );
}
