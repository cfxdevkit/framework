'use client';

import { CopyButton } from '@cfxdevkit/example-showcase-ui';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  buttonRowStyle,
  errorStyle,
  inputStyle,
  labelStyle,
  noteStyle,
  rowStyle,
  stackStyle,
} from '../devnode/devnode-ui';
import { type RevealSecretResponse, revealSecret } from '../keystore/client';
import { type ShowcaseWorkspacePanelsProps, sectionStyle } from './shared';

const CLEAR_AFTER_MS = 60_000;

export function RevealPanel(props: ShowcaseWorkspacePanelsProps) {
  const [kind, setKind] = useState<'mnemonic' | 'private-key'>('mnemonic');
  const [accountIndexStr, setAccountIndexStr] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [secret, setSecret] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopCountdown = useCallback(() => {
    if (countdownRef.current !== null) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    setCountdown(null);
  }, []);

  const clearSecret = useCallback(() => {
    stopCountdown();
    setSecret(null);
    setPassphrase('');
    setError(null);
    setBusy(false);
  }, [stopCountdown]);

  // Reset when the active wallet changes
  const walletId = props.activeWallet?.id ?? null;
  const prevWalletIdRef = useRef(walletId);
  useEffect(() => {
    if (prevWalletIdRef.current !== walletId) {
      prevWalletIdRef.current = walletId;
      clearSecret();
    }
  }, [walletId, clearSecret]);

  function startCountdown() {
    stopCountdown();
    const endsAt = Date.now() + CLEAR_AFTER_MS;
    setCountdown(Math.ceil(CLEAR_AFTER_MS / 1000));
    countdownRef.current = setInterval(() => {
      const remaining = Math.ceil((endsAt - Date.now()) / 1000);
      if (remaining <= 0) {
        clearSecret();
      } else {
        setCountdown(remaining);
      }
    }, 500);
  }

  useEffect(() => () => stopCountdown(), [stopCountdown]);

  async function handleReveal() {
    if (!props.activeWallet) return;
    setBusy(true);
    setError(null);
    setSecret(null);
    const accountIndex =
      kind === 'private-key'
        ? accountIndexStr.trim() !== ''
          ? Number(accountIndexStr)
          : props.activeWallet.activeAccountIndex
        : undefined;
    try {
      const result: RevealSecretResponse = await revealSecret({
        walletId: props.activeWallet.id,
        passphrase,
        kind,
        ...(accountIndex !== undefined ? { accountIndex } : {}),
      });
      if (!result.ok || result.secret === undefined) {
        setError(result.error ?? 'Reveal failed.');
      } else {
        setSecret(result.secret);
        startCountdown();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  const activeDefaultAccountIndex = props.activeWallet?.activeAccountIndex ?? 0;

  return (
    <section
      id="reveal"
      style={props.activeSection === 'reveal' ? sectionStyle : { display: 'none' }}
    >
      <div style={{ padding: '24px', backgroundColor: '#1e1e1e' }}>
        {/* Header */}
        <div
          style={{ paddingBottom: '16px', borderBottom: '1px solid #3c3c3c', marginBottom: '24px' }}
        >
          <h2
            style={{
              fontSize: '20px',
              margin: 0,
              fontWeight: 500,
              color: '#e7e7e7',
              marginBottom: '8px',
            }}
          >
            Secret Reveal
          </h2>
          <p style={{ margin: 0, color: '#888', fontSize: '13px', lineHeight: 1.5 }}>
            Export a wallet mnemonic or an account private key. Enter your passphrase and click
            Reveal.
          </p>
        </div>

        {/* Safety note — always visible */}
        <div
          style={{ ...noteStyle, marginBottom: '20px', borderColor: '#7c3aed55', color: '#c4b5fd' }}
        >
          ⚠ The passphrase travels over localhost HTTP. This panel is only safe in a local
          development environment.
        </div>

        {/* Phase guard */}
        {!props.activeWallet ? (
          <div style={{ color: '#888', fontSize: '13px', padding: '16px 0' }}>
            Unlock the keystore and activate a wallet to use secret reveal.
          </div>
        ) : (
          <div style={stackStyle}>
            {/* Kind selector */}
            <div style={rowStyle}>
              <span style={labelStyle}>Reveal kind</span>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                {(['mnemonic', 'private-key'] as const).map((k) => (
                  <label
                    key={k}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '13px',
                      color: '#a0a0a0',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="radio"
                      name="reveal-kind"
                      value={k}
                      checked={kind === k}
                      onChange={() => {
                        setKind(k);
                        setSecret(null);
                        stopCountdown();
                      }}
                    />
                    {k}
                  </label>
                ))}
              </div>
            </div>

            {/* Account index — only for private-key */}
            {kind === 'private-key' && (
              <div style={rowStyle}>
                <label htmlFor="reveal-account-index" style={labelStyle}>
                  Account index
                </label>
                <input
                  id="reveal-account-index"
                  style={inputStyle}
                  type="number"
                  min={0}
                  placeholder={`default: ${activeDefaultAccountIndex}`}
                  value={accountIndexStr}
                  onChange={(e) => setAccountIndexStr(e.target.value)}
                />
              </div>
            )}

            {/* Passphrase */}
            <div style={rowStyle}>
              <label htmlFor="reveal-passphrase" style={labelStyle}>
                Passphrase
              </label>
              <input
                id="reveal-passphrase"
                style={inputStyle}
                type="password"
                autoComplete="current-password"
                placeholder="keystore passphrase"
                value={passphrase}
                disabled={busy}
                onChange={(e) => setPassphrase(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !busy && passphrase) void handleReveal();
                }}
              />
            </div>

            {error && <div style={errorStyle}>{error}</div>}

            {/* Reveal button — always present */}
            {!secret && (
              <div style={buttonRowStyle}>
                <button
                  type="button"
                  disabled={busy || !passphrase}
                  onClick={() => void handleReveal()}
                >
                  {busy ? 'Revealing…' : 'Reveal'}
                </button>
              </div>
            )}

            {/* Revealed secret */}
            {secret && (
              <>
                <div style={{ ...noteStyle, borderColor: '#dc262655', color: '#fca5a5' }}>
                  ⚠ This secret is visible in your browser. Never share it or paste it into
                  untrusted contexts.
                </div>
                <div style={rowStyle}>
                  <label htmlFor="reveal-secret" style={labelStyle}>
                    {kind === 'mnemonic' ? 'Mnemonic phrase' : 'Private key'}
                  </label>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', flex: 1 }}>
                    <textarea
                      id="reveal-secret"
                      readOnly
                      value={secret}
                      rows={kind === 'mnemonic' ? 3 : 2}
                      style={{
                        ...inputStyle,
                        flex: 1,
                        fontFamily: 'monospace',
                        fontSize: '12px',
                        resize: 'none',
                        lineHeight: 1.6,
                      }}
                    />
                    <CopyButton label="copy secret" text={secret} />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {countdown !== null && (
                    <span style={{ fontSize: '12px', color: '#666' }}>Clears in {countdown}s</span>
                  )}
                  <button type="button" onClick={clearSecret}>
                    Clear
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
