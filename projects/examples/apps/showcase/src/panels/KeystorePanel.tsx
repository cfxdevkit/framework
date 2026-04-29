/**
 * KeystorePanel — exercises the in-memory `KeystoreProvider` from
 * `@cfxdevkit/services/keystore-memory`. Demonstrates `put`, `list`, `has`,
 * `getSigner`, capability binding, and signing a message round-trip.
 *
 * The memory backend refuses to load when `process.env.NODE_ENV === 'production'`,
 * so import dynamically and surface the error message verbatim if it fires.
 */
import type { Hex } from '@cfxdevkit/core';
import type { Capability, KeystoreProvider, StoredSecret } from '@cfxdevkit/services/keystore';
import { useCallback, useEffect, useState } from 'react';
import { CopyButton } from '../components/CopyButton.js';
import { useWallet } from '../contexts/WalletProvider.js';

interface SignResult {
  account: string;
  message: string;
  signature: Hex;
  withCapability: boolean;
  recoveredOk?: boolean;
}

export function KeystorePanel() {
  const w = useWallet();
  const [keystore, setKeystore] = useState<KeystoreProvider | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [list, setList] = useState<StoredSecret[]>([]);
  const [service, setService] = useState('showcase');
  const [account, setAccount] = useState('demo');
  const [chainId, setChainId] = useState(1030);
  const [useCap, setUseCap] = useState(false);
  const [message, setMessage] = useState('hello cfxdevkit');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<SignResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Lazy-load the memory keystore (refuses to load in production builds).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mod = await import('@cfxdevkit/services/keystore-memory');
        if (cancelled) return;
        setKeystore(mod.createMemoryKeystore());
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : String(e));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const refresh = useCallback(async () => {
    if (!keystore) return;
    setList(await keystore.list());
  }, [keystore]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const putActive = async () => {
    if (!keystore || !w.active) return;
    setError(null);
    setBusy(true);
    try {
      await keystore.put?.({
        ref: { service, account },
        kind: 'private-key',
        secret: w.active.privateKey,
        meta: {
          source: 'showcase-wallet',
          evm: w.active.evmAddress,
        },
      });
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const removeRef = async (ref: { service: string; account: string }) => {
    if (!keystore) return;
    setError(null);
    try {
      await keystore.remove?.(ref);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const signWith = async (ref: { service: string; account: string }) => {
    if (!keystore) return;
    setError(null);
    setBusy(true);
    setResult(null);
    try {
      const cap: Capability | undefined = useCap ? { chains: [chainId] } : undefined;
      const signer = await keystore.getSigner(ref, cap);
      const sig = await signer.signMessage(message);
      let recoveredOk: boolean | undefined;
      try {
        const { recoverMessageAddress } = await import('viem');
        const r = await recoverMessageAddress({ message, signature: sig });
        recoveredOk = r.toLowerCase() === signer.account.address.toLowerCase();
      } catch {
        // recovery is best-effort
      }
      setResult({
        account: signer.account.address,
        message,
        signature: sig,
        withCapability: !!cap,
        ...(recoveredOk !== undefined ? { recoveredOk } : {}),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  if (loadError) {
    return (
      <section className="panel">
        <h2>Keystore (memory)</h2>
        <div className="result" style={{ color: 'var(--err)' }}>
          {loadError}
          {'\n\n'}The in-memory keystore refuses to load in production builds. Run the showcase with{' '}
          <code className="mono">pnpm dev</code> instead.
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="panel">
        <h2>Keystore · in-memory backend</h2>
        <p className="panel-desc">
          Wraps <code className="mono">createMemoryKeystore()</code> from{' '}
          <code className="mono">@cfxdevkit/services/keystore-memory</code>. Stores private keys in
          browser RAM only — refuses to load when <code className="mono">NODE_ENV=production</code>.
        </p>

        <div className="row">
          <label>
            service
            <input value={service} onChange={(e) => setService(e.target.value)} />
          </label>
          <label>
            account
            <input value={account} onChange={(e) => setAccount(e.target.value)} />
          </label>
          <button
            type="button"
            className="primary"
            onClick={putActive}
            disabled={!w.active || busy}
            title={!w.active ? 'Connect a wallet account first' : undefined}
          >
            put(active wallet account)
          </button>
        </div>

        {!w.active && (
          <p className="muted" style={{ marginTop: 8 }}>
            Connect an account in the Wallet tab to enable <em>put</em>.
          </p>
        )}
      </section>

      <section className="panel">
        <h2>Stored secrets ({list.length})</h2>
        {list.length === 0 && <p className="muted">empty</p>}
        {list.map((s) => {
          const key = `${s.ref.service}/${s.ref.account}`;
          return (
            <div key={key} className="account-card">
              <div className="row-line">
                <span className="idx">{key}</span>
                <span className="path">{s.kind}</span>
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
          {useCap && (
            <label>
              chainId
              <input
                type="number"
                value={chainId}
                onChange={(e) => setChainId(Number(e.target.value) || 0)}
                style={{ width: 100 }}
              />
            </label>
          )}
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
