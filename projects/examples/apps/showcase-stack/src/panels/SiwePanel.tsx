/**
 * SiwePanel — Sign-In With Ethereum using a connected browser wallet.
 *
 * 1. GET /auth/nonce?address=…
 * 2. Build a SIWE message and sign via wagmi useSignMessage
 * 3. POST /auth/verify { message, signature } → bearer token
 * 4. GET /auth/me with the bearer token
 */

import { errMsg, WalletPickerModal } from '@cfxdevkit/example-showcase-ui';
import { useCallback, useEffect, useState } from 'react';
import { SiweMessage } from 'siwe';
import { useAccount, useSignMessage } from 'wagmi';
import { useNetwork } from '../contexts/NetworkProvider.js';
import { api } from '../lib/api.js';

const TOKEN_KEY = 'showcase-stack.siwe.token';

interface MeResult {
  address: string;
  issuedAt: number;
  expiresAt: number;
}

export function SiwePanel() {
  const { espace } = useNetwork();
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const chainId = espace.id;
  const [statement, setStatement] = useState('Sign in to the cfxdevkit showcase-stack.');
  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  });
  const [me, setMe] = useState<MeResult | null>(null);
  const [busy, setBusy] = useState<'idle' | 'nonce' | 'sign' | 'verify' | 'me'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [signedMsg, setSignedMsg] = useState<string | null>(null);
  const [backendOk, setBackendOk] = useState<boolean | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .health()
      .then(() => {
        if (!cancelled) setBackendOk(true);
      })
      .catch(() => {
        if (!cancelled) setBackendOk(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback((t: string | null) => {
    try {
      if (t) localStorage.setItem(TOKEN_KEY, t);
      else localStorage.removeItem(TOKEN_KEY);
    } catch {
      // ignore
    }
  }, []);

  const signIn = async () => {
    if (!address) {
      setError('Connect an eSpace wallet first');
      return;
    }
    setError(null);
    setMe(null);
    setSignedMsg(null);
    try {
      setBusy('nonce');
      const { nonce } = await api.authNonce(address);

      setBusy('sign');
      const siwe = new SiweMessage({
        domain: window.location.host || 'localhost',
        address,
        statement,
        uri: window.location.origin || 'http://localhost',
        version: '1',
        chainId,
        nonce,
        issuedAt: new Date().toISOString(),
      });
      const message = siwe.prepareMessage();
      const signature = await signMessageAsync({ message });
      setSignedMsg(message);

      setBusy('verify');
      const { token: t } = await api.authVerify({ message, signature });
      setToken(t);
      persist(t);

      setBusy('me');
      const m = await api.authMe(t);
      setMe(m);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy('idle');
    }
  };

  const fetchMe = async () => {
    if (!token) return;
    setBusy('me');
    setError(null);
    try {
      setMe(await api.authMe(token));
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy('idle');
    }
  };

  const logout = () => {
    setToken(null);
    setMe(null);
    setSignedMsg(null);
    persist(null);
  };

  const isBusy = busy !== 'idle';

  return (
    <div>
      {/* Backend health */}
      <div className="row" style={{ marginBottom: 16 }}>
        <span
          className="dot"
          style={{
            display: 'inline-block',
            width: 8,
            height: 8,
            borderRadius: '50%',
            background:
              backendOk === null ? 'var(--muted)' : backendOk ? 'var(--accent-2)' : 'var(--err)',
          }}
        />
        <span className="muted" style={{ fontSize: 12 }}>
          backend: {backendOk === null ? '…' : backendOk ? 'online' : 'offline'}
        </span>
      </div>

      {/* Wallet section */}
      {!isConnected ? (
        <div className="panel" style={{ marginBottom: 16 }}>
          <p className="muted" style={{ margin: '0 0 10px' }}>
            Connect a non-Fluent eSpace wallet to sign SIWE challenges.
          </p>
          <button type="button" className="primary" onClick={() => setPickerOpen(true)}>
            Connect eSpace Wallet
          </button>
          <WalletPickerModal open={pickerOpen} onClose={() => setPickerOpen(false)} />
        </div>
      ) : (
        <div className="panel" style={{ marginBottom: 16 }}>
          <div className="row">
            <span className="space-badge space-espace">eSpace</span>
            <span className="mono" style={{ fontSize: 12 }}>
              {address}
            </span>
          </div>
          <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>
            Chain ID: {chainId}
          </div>
        </div>
      )}

      {/* Statement editor */}
      <label style={{ marginBottom: 16 }}>
        Statement
        <textarea
          value={statement}
          rows={2}
          onChange={(e) => setStatement(e.target.value)}
          placeholder="I accept the terms of service."
        />
      </label>

      {/* Sign-in button */}
      <div className="row" style={{ marginBottom: 16 }}>
        <button
          type="button"
          className="primary"
          disabled={!isConnected || isBusy}
          onClick={() => void signIn()}
        >
          {busy === 'nonce'
            ? 'Fetching nonce…'
            : busy === 'sign'
              ? 'Sign in wallet…'
              : busy === 'verify'
                ? 'Verifying…'
                : busy === 'me'
                  ? 'Fetching me…'
                  : 'Sign In'}
        </button>
        {token && (
          <>
            <button
              type="button"
              className="secondary"
              disabled={isBusy}
              onClick={() => void fetchMe()}
            >
              GET /auth/me
            </button>
            <button type="button" className="secondary" onClick={logout}>
              Log out
            </button>
          </>
        )}
      </div>

      {/* SIWE message */}
      {signedMsg && (
        <div style={{ marginBottom: 12 }}>
          <div className="muted" style={{ fontSize: 11, marginBottom: 4 }}>
            Signed SIWE message
          </div>
          <pre className="result" style={{ whiteSpace: 'pre-wrap' }}>
            {signedMsg}
          </pre>
        </div>
      )}

      {/* Token */}
      {token && (
        <div style={{ marginBottom: 12 }}>
          <div className="muted" style={{ fontSize: 11, marginBottom: 4 }}>
            Bearer token (stored in localStorage)
          </div>
          <pre className="result">{token}</pre>
        </div>
      )}

      {/* /auth/me result */}
      {me && (
        <div style={{ marginBottom: 12 }}>
          <div className="muted" style={{ fontSize: 11, marginBottom: 4 }}>
            GET /auth/me
          </div>
          <table className="status-table">
            <tbody>
              <tr>
                <th>address</th>
                <td className="mono">{me.address}</td>
              </tr>
              <tr>
                <th>issuedAt</th>
                <td>{new Date(me.issuedAt).toLocaleString()}</td>
              </tr>
              <tr>
                <th>expiresAt</th>
                <td>{new Date(me.expiresAt).toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {error && (
        <div className="result" style={{ color: 'var(--err)' }}>
          {error}
        </div>
      )}
    </div>
  );
}
