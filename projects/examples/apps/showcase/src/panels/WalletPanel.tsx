/**
 * WalletPanel — pick a derived account and "connect" it. Mirrors the role of
 * a `ConnectButton` in production wallet stacks but uses a local mnemonic so
 * the demo runs without a browser wallet extension.
 */
import { generateMnemonic, validateMnemonic } from '@cfxdevkit/core';
import { CopyButton } from '../components/CopyButton.js';
import { TEST_MNEMONIC, useWallet } from '../contexts/WalletProvider.js';

export function WalletPanel() {
  const w = useWallet();
  const mnemonicValid = validateMnemonic(w.mnemonic.trim());

  return (
    <>
      <div className="warning">
        ⚠ The "wallet" here is a local-mnemonic stand-in for a browser wallet. Other showcase tabs
        (SIWE, Session Key, Keystore) consume the active signer from this panel. Never paste a
        mnemonic that secures real funds.
      </div>

      <section className="panel">
        <h2>Wallet · local mnemonic</h2>
        <p className="panel-desc">
          Drives a <code className="mono">Signer</code> via{' '}
          <code className="mono">deriveDualAccount</code> +{' '}
          <code className="mono">signerFromPrivateKey</code>. The active address is shared across
          panels via a React context.
        </p>

        <label>
          Mnemonic
          <textarea rows={2} value={w.mnemonic} onChange={(e) => w.setMnemonic(e.target.value)} />
        </label>

        <div className="row" style={{ marginTop: 12 }}>
          <label>
            Pool size
            <input
              type="number"
              min={1}
              max={20}
              value={w.accounts.length}
              onChange={(e) => w.rederive(Number(e.target.value) || 1)}
              style={{ width: 80 }}
            />
          </label>
          <button
            type="button"
            className="secondary"
            onClick={() => w.setMnemonic(generateMnemonic(128))}
          >
            New mnemonic
          </button>
          <button type="button" className="secondary" onClick={() => w.setMnemonic(TEST_MNEMONIC)}>
            Reset to hardhat vector
          </button>
        </div>

        {!mnemonicValid && (
          <div className="result" style={{ color: 'var(--err)' }}>
            Invalid BIP-39 mnemonic.
          </div>
        )}
      </section>

      <section className="panel">
        <h2>{w.activeIndex === null ? 'Pick an account' : 'Connected'}</h2>
        <p className="panel-desc">
          {w.activeIndex === null
            ? 'Click "Connect" on a row to make it the active signer.'
            : `Account [${w.activeIndex}] is the active signer used by SIWE / Session Key / Keystore tabs.`}
        </p>

        {w.accounts.map((a) => {
          const isActive = a.index === w.activeIndex;
          return (
            <div
              key={a.index}
              className="account-card"
              style={
                isActive
                  ? { borderColor: 'var(--accent)', boxShadow: '0 0 0 1px var(--accent)' }
                  : {}
              }
            >
              <div className="row-line">
                <span className="idx">[{a.index}]</span>
                {isActive ? (
                  <button type="button" className="secondary" onClick={() => w.disconnect()}>
                    Disconnect
                  </button>
                ) : (
                  <button type="button" className="primary" onClick={() => w.connect(a.index)}>
                    Connect
                  </button>
                )}
              </div>
              <div className="row-line">
                <span className="label">evm</span>
                <span>{a.evmAddress}</span>
                <CopyButton text={a.evmAddress} />
              </div>
              <div className="row-line">
                <span className="label">core</span>
                <span>{a.coreAddress}</span>
                <CopyButton text={a.coreAddress} />
              </div>
            </div>
          );
        })}
      </section>
    </>
  );
}
