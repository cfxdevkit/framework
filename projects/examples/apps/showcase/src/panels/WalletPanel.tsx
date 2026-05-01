/**
 * WalletPanel — pick a derived account and "connect" it. Mirrors the role of
 * a `ConnectButton` in production wallet stacks but uses a local mnemonic so
 * the demo runs without a browser wallet extension.
 */
import { validateMnemonic } from '@cfxdevkit/core';
import { CopyButton } from '../components/CopyButton.js';
import { useKeystoreSession } from '../contexts/KeystoreSessionProvider.js';
import { useWallet } from '../contexts/WalletProvider.js';

export function WalletPanel() {
  const w = useWallet();
  const session = useKeystoreSession();
  const mnemonicValid = validateMnemonic(w.mnemonic.trim());

  return (
    <>
      <div className="warning">
        The showcase session is centralized here: wallet selection, signer state, network
        capability, and devnode seed alignment all flow through the keystore session provider.
      </div>

      <section className="panel">
        <h2>Keystore session</h2>
        <p className="panel-desc">
          Active backend: <code className="mono">{session.backendId}</code>. Session:{' '}
          <code className="mono">{session.sessionId}</code>.
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
          <button type="button" className="secondary" onClick={() => session.createMnemonic()}>
            New mnemonic
          </button>
          <button type="button" className="secondary" onClick={() => session.resetMnemonic()}>
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
        <h2>{w.activeIndex === null ? 'Select active wallet' : 'Active wallet'}</h2>
        <p className="panel-desc">
          {w.activeIndex === null
            ? 'Choose one wallet from the session list before signing or starting the local node.'
            : `Wallet [${w.activeIndex}] is the active signer for wallet-bound clients and panels.`}
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
              <div className="row-line">
                <span className="label">ref</span>
                <span>
                  {a.ref.service}/{a.ref.account}
                </span>
              </div>
            </div>
          );
        })}
      </section>
    </>
  );
}
