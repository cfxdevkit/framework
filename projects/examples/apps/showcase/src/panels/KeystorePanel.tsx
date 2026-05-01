import type { Hex } from '@cfxdevkit/core';
import type { Capability, SecretRef } from '@cfxdevkit/services/keystore';
import { useState } from 'react';
import { CopyButton } from '../components/CopyButton.js';
import { useKeystoreSession } from '../contexts/KeystoreSessionProvider.js';

interface SignResult {
  account: string;
  message: string;
  signature: Hex;
  withCapability: boolean;
  recoveredOk?: boolean;
}

export function KeystorePanel() {
  const session = useKeystoreSession();
  const [useCap, setUseCap] = useState(false);
  const [message, setMessage] = useState('hello cfxdevkit');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<SignResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const removeRef = async (ref: SecretRef) => {
    setError(null);
    try {
      await session.removeWallet(ref);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const signWith = async (ref: SecretRef) => {
    setError(null);
    setBusy(true);
    setResult(null);
    try {
      const cap: Capability | undefined = useCap ? session.capability : undefined;
      const signed = await session.signMessage(ref, message, cap);
      let recoveredOk: boolean | undefined;
      try {
        const { recoverMessageAddress } = await import('viem');
        const r = await recoverMessageAddress({ message, signature: signed.signature });
        recoveredOk = r.toLowerCase() === signed.account.toLowerCase();
      } catch {
        // recovery is best-effort
      }
      setResult({
        account: signed.account,
        message,
        signature: signed.signature,
        withCapability: !!cap,
        ...(recoveredOk !== undefined ? { recoveredOk } : {}),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <section className="panel">
        <h2>Keystore session</h2>
        <p className="panel-desc">
          Central session status and mnemonic-root metadata. Signers are requested through the
          selected root and derived account, with network capability derived from the active
          network.
        </p>

        <dl className="kv small">
          <dt>backend</dt>
          <dd className="mono">{session.backendId}</dd>
          <dt>status</dt>
          <dd className="mono">{session.status}</dd>
          <dt>network</dt>
          <dd className="mono">{session.networkId}</dd>
          <dt>capability</dt>
          <dd className="mono">chains: {session.chainIds.join(', ')}</dd>
          <dt>session</dt>
          <dd className="mono">{session.sessionId}</dd>
        </dl>
        {session.error && (
          <div className="result" style={{ color: 'var(--err)' }}>
            {session.error}
          </div>
        )}
        <div className="row" style={{ marginTop: 12 }}>
          <button type="button" className="secondary" onClick={() => session.addWallet()}>
            Generate mnemonic
          </button>
          <button
            type="button"
            className="secondary"
            onClick={() => session.restoreRemovedWallets()}
          >
            Reset roots
          </button>
          <button type="button" className="secondary" onClick={() => session.disconnect()}>
            Clear account
          </button>
        </div>
      </section>

      <section className="panel">
        <h2>Mnemonic roots ({session.wallets.length})</h2>
        {session.wallets.length === 0 && <p className="muted">empty</p>}
        {session.wallets.map((s) => {
          const key = `${s.ref.service}/${s.ref.account}`;
          const isActive =
            session.activeWalletRef?.service === s.ref.service &&
            session.activeWalletRef.account === s.ref.account;
          return (
            <div key={key} className="account-card">
              <div className="row-line">
                <span className="idx">{key}</span>
                <span className="path">{s.kind}</span>
                {isActive && <span className="tag">active</span>}
                {!isActive && (
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => session.selectMnemonic(s.ref)}
                    disabled={busy}
                  >
                    select
                  </button>
                )}
                <button
                  type="button"
                  className="secondary"
                  onClick={() => signWith(s.ref)}
                  disabled={busy || !isActive || session.activeIndex === null}
                >
                  sign selected account
                </button>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => removeRef(s.ref)}
                  disabled={busy}
                >
                  remove
                </button>
              </div>
              {s.meta?.storage && (
                <div className="row-line">
                  <span className="label">storage</span>
                  <span>{s.meta.storage}</span>
                </div>
              )}
            </div>
          );
        })}

        <h3>Derived accounts ({session.accounts.length})</h3>
        {session.accounts.map((account) => (
          <div key={account.index} className="account-card">
            <div className="row-line">
              <span className="idx">#{account.index}</span>
              <span className="path">{account.paths.evm}</span>
              {session.activeIndex === account.index && <span className="tag">active</span>}
              {session.activeIndex !== account.index && (
                <button
                  type="button"
                  className="secondary"
                  onClick={() => session.selectWallet(account.index)}
                  disabled={busy}
                >
                  select
                </button>
              )}
            </div>
            <div className="row-line">
              <span className="label">evm</span>
              <span>{account.evmAddress}</span>
              <CopyButton text={account.evmAddress} />
            </div>
          </div>
        ))}

        <div className="row" style={{ marginTop: 12 }}>
          <label>
            message
            <input value={message} onChange={(e) => setMessage(e.target.value)} />
          </label>
          <label style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <input type="checkbox" checked={useCap} onChange={(e) => setUseCap(e.target.checked)} />
            <span>bind chain capability</span>
          </label>
          {useCap && <span className="mono small">{session.chainIds.join(', ')}</span>}
        </div>

        {error && (
          <div className="result" style={{ color: 'var(--err)' }}>
            {error}
          </div>
        )}
        {result && (
          <div className="result">
            address : {result.account}
            {'\n'}message : {result.message}
            {'\n'}sig : {result.signature}
            {'\n'}capable : {String(result.withCapability)}
            {result.recoveredOk !== undefined && (
              <>
                {'\n'}recover : {result.recoveredOk ? 'OK ✓' : 'MISMATCH ✗'}
              </>
            )}
          </div>
        )}
      </section>
    </>
  );
}
