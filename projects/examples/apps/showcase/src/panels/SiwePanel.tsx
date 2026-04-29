/**
 * SiwePanel — full Sign-In With Ethereum round trip against
 * `@cfxdevkit/example-showcase-backend`.
 *
 * 1. GET /auth/nonce?address=…
 * 2. Build a SIWE message and sign it with the active wallet signer
 * 3. POST /auth/verify { message, signature } → bearer token
 * 4. GET /auth/me with the bearer token
 */
import { useCallback, useEffect, useState } from 'react';
import { SiweMessage } from 'siwe';
import { useWallet } from '../contexts/WalletProvider.js';
import { type ApiError, api } from '../lib/api.js';

const TOKEN_KEY = 'showcase.siwe.token';

interface MeResult {
  address: string;
  issuedAt: number;
  expiresAt: number;
}

export function SiwePanel() {
  const w = useWallet();
  const [chainId, setChainId] = useState(1030);
  const [statement, setStatement] = useState('Sign in to the cfxdevkit showcase.');
  const [token, setToken] = useState<string | null>(() =>
    typeof localStorage === 'undefined' ? null : localStorage.getItem(TOKEN_KEY),
  );
  const [me, setMe] = useState<MeResult | null>(null);
  const [busy, setBusy] = useState<'idle' | 'signing' | 'verifying' | 'me'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [signedMessage, setSignedMessage] = useState<string | null>(null);
  const [backendOk, setBackendOk] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .health()
      .then(() => !cancelled && setBackendOk(true))
      .catch(() => !cancelled && setBackendOk(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback((t: string | null) => {
    if (typeof localStorage === 'undefined') return;
    if (t) localStorage.setItem(TOKEN_KEY, t);
    else localStorage.removeItem(TOKEN_KEY);
  }, []);

  const signIn = async () => {
    if (!w.signer || !w.active) {
      setError('Connect a wallet account first');
      return;
    }
    setError(null);
    setMe(null);
    setSignedMessage(null);
    try {
      setBusy('signing');
      const { nonce } = await api.authNonce(w.active.evmAddress);
      const siwe = new SiweMessage({
        domain: window.location.host || 'localhost',
        address: w.active.evmAddress,
        statement,
        uri: window.location.origin || 'http://localhost',
        version: '1',
        chainId,
        nonce,
        issuedAt: new Date().toISOString(),
      });
      const message = siwe.prepareMessage();
      const signature = await w.signer.signMessage(message);
      setSignedMessage(message);

      setBusy('verifying');
      const { token: t } = await api.authVerify({ message, signature });
      setToken(t);
      persist(t);

      setBusy('me');
      const m = await api.authMe(t);
      setMe(m);
    } catch (e) {
      const err = e as ApiError | Error;
      setError(err.message);
    } finally {
      setBusy('idle');
    }
  };

  const fetchMe = async () => {
    if (!token) return;
    setError(null);
    try {
      setBusy('me');
      setMe(await api.authMe(token));
    } catch (e) {
      const err = e as ApiError | Error;
      setError(err.message);
      if ((e as ApiError).status === 401) {
        setToken(null);
        persist(null);
      }
    } finally {
      setBusy('idle');
    }
  };

  const signOut = () => {
    setToken(null);
    persist(null);
    setMe(null);
  };

  return (
    <>
      <section className="panel">
        <h2>SIWE · Sign-In With Ethereum</h2>
        <p className="panel-desc">
          Backend: <code className="mono">{api.baseUrl}</code> ·{' '}
          {backendOk === null ? (
            <span className="muted">probing…</span>
          ) : backendOk ? (
            <span style={{ color: 'var(--accent-2)' }}>healthy</span>
          ) : (
            <span style={{ color: 'var(--err)' }}>unreachable — start showcase-backend</span>
          )}
        </p>

        <div className="row">
          <label style={{ flex: 1 }}>
            statement
            <input value={statement} onChange={(e) => setStatement(e.target.value)} />
          </label>
          <label>
            chainId
            <input
              type="number"
              value={chainId}
              onChange={(e) => setChainId(Number(e.target.value) || 0)}
              style={{ width: 100 }}
            />
          </label>
        </div>

        <div className="row" style={{ marginTop: 12 }}>
          <button
            type="button"
            className="primary"
            onClick={signIn}
            disabled={!w.active || busy !== 'idle'}
          >
            {busy === 'signing'
              ? 'Signing…'
              : busy === 'verifying'
                ? 'Verifying…'
                : busy === 'me'
                  ? 'Fetching /me…'
                  : 'Sign in'}
          </button>
          <button
            type="button"
            className="secondary"
            onClick={fetchMe}
            disabled={!token || busy !== 'idle'}
          >
            Re-fetch /auth/me
          </button>
          <button type="button" className="secondary" onClick={signOut} disabled={!token}>
            Sign out
          </button>
        </div>

        {!w.active && (
          <p className="muted" style={{ marginTop: 8 }}>
            Connect an account in the Wallet tab first.
          </p>
        )}
        {error && (
          <div className="result" style={{ color: 'var(--err)' }}>
            {error}
          </div>
        )}
      </section>

      {signedMessage && (
        <section className="panel">
          <h2>Signed SIWE message</h2>
          <pre className="result">{signedMessage}</pre>
        </section>
      )}

      {token && (
        <section className="panel">
          <h2>Bearer token</h2>
          <p className="panel-desc">stored in localStorage as {TOKEN_KEY}</p>
          <div className="result">{token}</div>
          {me && (
            <>
              <h2 style={{ marginTop: 16 }}>/auth/me</h2>
              <div className="result">
                address : {me.address}
                {'\n'}issued at : {new Date(me.issuedAt).toISOString()}
                {'\n'}expires at : {new Date(me.expiresAt).toISOString()}
              </div>
            </>
          )}
        </section>
      )}
    </>
  );
}
