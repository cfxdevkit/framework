/**
 * `<WalletPill>` — header chip that shows the currently connected showcase
 * wallet (address + native balance on the active space) and offers a
 * one-click connect / disconnect / switch-account.
 *
 * Balance is queried directly via the active client:
 *   - eSpace → `eth_getBalance(address, 'latest')`
 *   - Core   → `cfx_getBalance(coreAddress, 'latest_state')`
 *
 * Polled every 5 s while the wallet is connected (so the new balance after a
 * deploy / transfer surfaces without a manual refresh).
 */
import { formatUnits, type Hex } from '@cfxdevkit/core';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useKeystoreSession } from '../contexts/KeystoreSessionProvider.js';
import { useNetwork } from '../contexts/NetworkProvider.js';
import { useWallet } from '../contexts/WalletProvider.js';

const POLL_MS = 5_000;

function shortAddr(addr: string): string {
  if (addr.length <= 14) return addr;
  return `${addr.slice(0, 8)}…${addr.slice(-6)}`;
}

export function WalletPill() {
  const { active, accounts, activeIndex, connect, disconnect } = useWallet();
  const session = useKeystoreSession();
  const { space, activeClient } = useNetwork();
  const [open, setOpen] = useState(false);
  const [balance, setBalance] = useState<bigint | null>(null);
  const [balanceErr, setBalanceErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const address = useMemo(() => {
    if (!active) return null;
    return space === 'core' ? active.coreAddress : active.evmAddress;
  }, [active, space]);

  const refreshBalance = useCallback(
    async (signal?: AbortSignal) => {
      if (!address) {
        setBalance(null);
        return;
      }
      setLoading(true);
      try {
        const hex =
          space === 'core'
            ? await activeClient.request<Hex>({
                method: 'cfx_getBalance',
                params: [address, 'latest_state'],
              })
            : await activeClient.request<Hex>({
                method: 'eth_getBalance',
                params: [address, 'latest'],
              });
        if (signal?.aborted) return;
        setBalance(BigInt(hex));
        setBalanceErr(null);
      } catch (e) {
        if (signal?.aborted) return;
        setBalanceErr(e instanceof Error ? e.message : String(e));
        setBalance(null);
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [address, space, activeClient],
  );

  useEffect(() => {
    const ctrl = new AbortController();
    void refreshBalance(ctrl.signal);
    if (!address) return () => ctrl.abort();
    const t = window.setInterval(() => void refreshBalance(), POLL_MS);
    return () => {
      ctrl.abort();
      window.clearInterval(t);
    };
  }, [refreshBalance, address]);

  const dot = active ? (balance !== null && balance > 0n ? 'green' : 'amber') : 'gray';

  const label = (() => {
    if (session.status !== 'ready') return `keystore · ${session.status}`;
    if (!active) return 'keystore · select wallet';
    const bal = balance !== null ? `${Number(formatUnits(balance, 18)).toFixed(4)} CFX` : '…';
    return `[${active.index}] ${shortAddr(address ?? '')} · ${bal}`;
  })();

  return (
    <div className="pill-wrap" title="Wallet controls">
      <button
        type="button"
        className="pill"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={`dot dot-${dot}`} aria-hidden />
        <span className="pill-label">{label}</span>
      </button>
      {open && (
        <div className="popover" role="dialog" aria-label="Wallet controls">
          <dl className="kv small">
            <dt>backend</dt>
            <dd className="mono">{session.backendId}</dd>
            <dt>status</dt>
            <dd className="mono">{session.status}</dd>
            <dt>network</dt>
            <dd className="mono">{session.networkId}</dd>
            <dt>chains</dt>
            <dd className="mono">{session.chainIds.join(', ')}</dd>
          </dl>
          {session.error && <p className="error small">{session.error}</p>}
          {!active && accounts.length === 0 && (
            <p className="muted small">
              No wallet metadata available. Open the <strong>Wallet</strong> tab to initialize.
            </p>
          )}
          {!active && accounts.length > 0 && (
            <>
              <p className="small">Pick an account to connect:</p>
              <ul className="acct-list">
                {accounts.map((a) => (
                  <li key={a.index}>
                    <button
                      type="button"
                      className="primary small"
                      onClick={() => {
                        connect(a.index);
                        setOpen(false);
                      }}
                    >
                      Connect [{a.index}]
                    </button>
                    <code className="mono small">
                      {space === 'core' ? a.coreAddress : a.evmAddress}
                    </code>
                  </li>
                ))}
              </ul>
            </>
          )}
          {active && (
            <>
              <dl className="kv small">
                <dt>index</dt>
                <dd>[{activeIndex}]</dd>
                <dt>{space === 'core' ? 'core addr' : 'eSpace addr'}</dt>
                <dd className="mono" style={{ wordBreak: 'break-all' }}>
                  {address}
                </dd>
                <dt>balance</dt>
                <dd className="mono">
                  {balance !== null ? `${formatUnits(balance, 18)} CFX` : loading ? '…' : '?'}
                </dd>
                {balanceErr && (
                  <>
                    <dt>error</dt>
                    <dd className="error small">{balanceErr}</dd>
                  </>
                )}
              </dl>
              <div className="row" style={{ gap: 6, marginTop: 8 }}>
                <button
                  type="button"
                  className="small"
                  disabled={loading}
                  onClick={() => void refreshBalance()}
                >
                  Refresh
                </button>
                <button
                  type="button"
                  className="secondary small"
                  onClick={() => {
                    disconnect();
                    setOpen(false);
                  }}
                >
                  Disconnect
                </button>
              </div>
              {accounts.length > 1 && (
                <>
                  <p className="muted small" style={{ marginTop: 8 }}>
                    Switch account:
                  </p>
                  <div className="row" style={{ gap: 4, flexWrap: 'wrap' }}>
                    {accounts.map((a) => (
                      <button
                        key={a.index}
                        type="button"
                        className={`small ${a.index === activeIndex ? 'primary' : ''}`}
                        onClick={() => connect(a.index)}
                      >
                        [{a.index}]
                      </button>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
