import {
  type CoreNetworkId,
  type DualAddressAccount,
  deriveDualAccounts,
  generateMnemonic,
  validateMnemonic,
} from '@cfxdevkit/core';
import { useState } from 'react';
import { CopyButton } from '../components/CopyButton.js';

const TEST_MNEMONIC = 'test test test test test test test test test test test junk';

const NETWORKS: { id: CoreNetworkId; label: string }[] = [
  { id: 1029, label: 'Core Mainnet (cfx:…)' },
  { id: 1, label: 'Core Testnet (cfxtest:…)' },
  { id: 2029, label: 'Local Devnet (net2029:…)' },
];

export function DerivePanel() {
  const [mnemonic, setMnemonic] = useState(TEST_MNEMONIC);
  const [count, setCount] = useState(3);
  const [startIndex, setStartIndex] = useState(0);
  const [coreNetworkId, setCoreNetworkId] = useState<CoreNetworkId>(1029);
  const [accountType, setAccountType] = useState<'standard' | 'mining'>('standard');
  const [showPk, setShowPk] = useState(false);
  const [accounts, setAccounts] = useState<DualAddressAccount[]>([]);
  const [error, setError] = useState<string | null>(null);

  const derive = () => {
    setError(null);
    try {
      if (!validateMnemonic(mnemonic)) {
        throw new Error('Mnemonic failed BIP-39 validation');
      }
      const out = deriveDualAccounts({
        mnemonic: mnemonic.trim(),
        count,
        startIndex,
        coreNetworkId,
        accountType,
      });
      setAccounts(out);
    } catch (e) {
      setAccounts([]);
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <>
      <div className="warning">
        ⚠ This is a development tool. Never paste a real mnemonic that secures funds. The default
        phrase is the well-known hardhat/anvil test vector.
      </div>

      <section className="panel">
        <h2>Dual-space HD derivation</h2>
        <p className="panel-desc">
          Calls <code className="mono">deriveDualAccounts(...)</code>. Each index produces a
          secp256k1 key encoded both as an EVM <code className="mono">0x…</code> address (eSpace,
          path <code className="mono">m/44'/60'/A'/0/i</code>) and as a Conflux Core base32 address
          (path <code className="mono">m/44'/503'/A'/0/i</code>) where{' '}
          <code className="mono">A=0</code> for standard accounts and{' '}
          <code className="mono">A=1</code> for mining/faucet accounts.
        </p>

        <label>
          Mnemonic
          <textarea value={mnemonic} onChange={(e) => setMnemonic(e.target.value)} rows={2} />
        </label>

        <div className="row" style={{ marginTop: 12 }}>
          <label>
            Count
            <input
              type="number"
              min={1}
              max={50}
              value={count}
              onChange={(e) => setCount(Math.max(1, Math.min(50, Number(e.target.value) || 1)))}
              style={{ width: 80 }}
            />
          </label>
          <label>
            Start index
            <input
              type="number"
              min={0}
              value={startIndex}
              onChange={(e) => setStartIndex(Math.max(0, Number(e.target.value) || 0))}
              style={{ width: 80 }}
            />
          </label>
          <label>
            Account type
            <select
              value={accountType}
              onChange={(e) => setAccountType(e.target.value as 'standard' | 'mining')}
            >
              <option value="standard">standard (0')</option>
              <option value="mining">mining (1')</option>
            </select>
          </label>
          <label>
            Core network
            <select
              value={coreNetworkId}
              onChange={(e) => setCoreNetworkId(Number(e.target.value) as CoreNetworkId)}
            >
              {NETWORKS.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.label}
                </option>
              ))}
            </select>
          </label>
          <label style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <input type="checkbox" checked={showPk} onChange={(e) => setShowPk(e.target.checked)} />
            <span>show private keys</span>
          </label>
        </div>

        <div className="row" style={{ marginTop: 12 }}>
          <button type="button" className="primary" onClick={derive}>
            Derive
          </button>
          <button
            type="button"
            className="secondary"
            onClick={() => setMnemonic(generateMnemonic(128))}
          >
            New mnemonic
          </button>
          <button type="button" className="secondary" onClick={() => setMnemonic(TEST_MNEMONIC)}>
            Reset to test vector
          </button>
        </div>

        {error && (
          <div className="result" style={{ color: 'var(--err)' }}>
            {error}
          </div>
        )}
      </section>

      {accounts.length > 0 && (
        <section className="panel">
          <h2>
            {accounts.length} account{accounts.length === 1 ? '' : 's'}
          </h2>
          <p className="panel-desc">
            accountType={accountType} · coreNetworkId={coreNetworkId}
          </p>
          {accounts.map((a) => (
            <div key={a.index} className="account-card">
              <div className="row-line">
                <span className="idx">[{a.index}]</span>
              </div>
              <div className="row-line">
                <span className="label">evm</span>
                <span>{a.evmAddress}</span>
                <CopyButton text={a.evmAddress} />
                <span className="path">{a.paths.evm}</span>
              </div>
              <div className="row-line">
                <span className="label">core</span>
                <span>{a.coreAddress}</span>
                <CopyButton text={a.coreAddress} />
                <span className="path">{a.paths.core}</span>
              </div>
              {showPk && (
                <div className="row-line">
                  <span className="label">pk</span>
                  <span style={{ color: 'var(--err)' }}>{a.privateKey}</span>
                  <CopyButton text={a.privateKey} />
                </div>
              )}
            </div>
          ))}
        </section>
      )}
    </>
  );
}
