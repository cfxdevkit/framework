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
          Central session status and wallet metadata. Signers are requested through the session,
          with network capability derived from the active network.
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
      </section>

      <section className="panel">
        <h2>Stored wallets ({session.wallets.length})</h2>
        {session.wallets.length === 0 && <p className="muted">empty</p>}
        {session.wallets.map((s) => {
          const key = `${s.ref.service}/${s.ref.account}`;
          const isActive =
            session.activeRef?.service === s.ref.service &&
            session.activeRef.account === s.ref.account;
          return (
            <div key={key} className="account-card">
              <div className="row-line">
                <span className="idx">{key}</span>
                <span className="path">{s.kind}</span>
                {isActive && <span className="tag">active</span>}
                <button
                  type="button"
                  className="secondary"
                  onClick={() => signWith(s.ref)}
                  disabled={busy}
                >
                  sign message
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
              {s.meta?.evm && (
                <div className="row-line">
                  <span className="label">evm</span>
                  <span>{s.meta.evm}</span>
                  <CopyButton text={s.meta.evm} />
                </div>
              )}
            </div>
          );
        })}

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
