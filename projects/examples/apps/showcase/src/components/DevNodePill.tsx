/**
 * `<DevNodePill>` — header chip that drives the showcase-backend's
 * `/devnode` lifecycle endpoints. Visible on every screen but only
 * actionable when the active network is `local` (the only network whose
 * RPCs point at the locally-spawned node).
 *
 * Polls `/devnode/status` every 5 s. Click expands a popover with
 * Start / Stop / Restart / Wipe controls + the genesis account list
 * (so users can copy a funded private key into a panel).
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNetwork } from '../contexts/NetworkProvider.js';
import { api, type DevNodeStatusResponse } from '../lib/api.js';

const POLL_MS = 5_000;

type Action = 'start' | 'stop' | 'restart' | 'wipe' | null;

export function DevNodePill() {
  const { network } = useNetwork();
  const [status, setStatus] = useState<DevNodeStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<Action>(null);

  const refresh = useCallback(async (signal?: AbortSignal) => {
    try {
      const s = await api.devnodeStatus(signal);
      setStatus(s);
      setError(null);
    } catch (e) {
      if ((e as { name?: string }).name === 'AbortError') return;
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    void refresh(ctrl.signal);
    const t = window.setInterval(() => void refresh(), POLL_MS);
    return () => {
      ctrl.abort();
      window.clearInterval(t);
    };
  }, [refresh]);

  const run = useCallback(async (action: Exclude<Action, null>) => {
    setBusy(action);
    setError(null);
    try {
      if (action === 'start') setStatus(await api.devnodeStart());
      else if (action === 'stop') setStatus(await api.devnodeStop());
      else if (action === 'restart') setStatus(await api.devnodeRestart());
      else if (action === 'wipe') setStatus(await api.devnodeWipe());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }, []);

  const offline = error !== null && status === null;

  const dot = useMemo(() => {
    if (offline) return 'red';
    const s = status?.status;
    if (s === 'running') return 'green';
    if (s === 'starting' || s === 'stopping') return 'amber';
    if (s === 'error') return 'red';
    return 'gray';
  }, [status, offline]);

  const label = (() => {
    if (busy === 'start') return 'devnode · starting…';
    if (busy === 'stop') return 'devnode · stopping…';
    if (busy === 'restart') return 'devnode · restarting…';
    if (busy === 'wipe') return 'devnode · wiping…';
    if (offline) return 'backend offline · :5174';
    if (!status) return 'devnode…';
    if (status.status === 'running' && status.urls)
      return `devnode · :${status.config?.evmRpcPort ?? '?'}/${status.config?.coreRpcPort ?? '?'}`;
    return `devnode · ${status.status}`;
  })();

  const isLocal = network.id === 'local';

  return (
    <div className={`pill-wrap ${isLocal ? '' : 'pill-muted'}`} title="Local devnode controls">
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
        <div className="popover" role="dialog" aria-label="Dev node controls">
          {!isLocal && (
            <p className="muted small">
              Switch network to <strong>Local</strong> to use the dev node.
            </p>
          )}
          {offline && (
            <p className="error small">
              Showcase backend not reachable on <code className="mono">:5174</code>. Start it with{' '}
              <code className="mono">pnpm --filter @cfxdevkit/example-showcase-backend dev</code>.
            </p>
          )}
          {error && !offline && <p className="error small">{error}</p>}

          <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="small"
              disabled={busy !== null}
              onClick={() => void refresh()}
            >
              Refresh
            </button>
            <button
              type="button"
              className="primary small"
              disabled={busy !== null || status?.running === true}
              onClick={() => run('start')}
            >
              {busy === 'start' ? '…' : 'Start'}
            </button>
            <button
              type="button"
              className="small"
              disabled={busy !== null || !status?.running}
              onClick={() => run('restart')}
            >
              {busy === 'restart' ? '…' : 'Restart'}
            </button>
            <button
              type="button"
              className="small"
              disabled={busy !== null || !status?.running}
              onClick={() => run('stop')}
            >
              {busy === 'stop' ? '…' : 'Stop'}
            </button>
            <button
              type="button"
              className="danger small"
              disabled={busy !== null}
              onClick={() => {
                if (window.confirm('Stop the dev node and delete its data dir?')) void run('wipe');
              }}
            >
              {busy === 'wipe' ? '…' : 'Wipe'}
            </button>
          </div>

          {status?.urls && (
            <dl className="kv small">
              <dt>core</dt>
              <dd className="mono">{status.urls.core}</dd>
              <dt>espace</dt>
              <dd className="mono">{status.urls.espace}</dd>
              {status.config && (
                <>
                  <dt>chainId</dt>
                  <dd className="mono">
                    {status.config.chainId} / {status.config.evmChainId}
                  </dd>
                  <dt>mining</dt>
                  <dd className="mono">
                    {status.mining?.enabled ? `every ${status.mining.intervalMs}ms` : 'off'}
                    {status.mining?.ticks ? ` · ${status.mining.ticks} ticks` : ''}
                  </dd>
                </>
              )}
            </dl>
          )}

          {status?.accounts && status.accounts.length > 0 && (
            <details>
              <summary className="small">{status.accounts.length} funded accounts</summary>
              <ul className="acct-list">
                {status.accounts.map((a) => (
                  <li key={a.index}>
                    <span className="muted small">
                      [{a.index}] {a.initialBalanceCfx} CFX
                    </span>
                    <button
                      type="button"
                      className="link"
                      onClick={() => void navigator.clipboard.writeText(a.privateKey)}
                      title="Copy private key"
                    >
                      copy pk
                    </button>
                    <code className="mono small">{a.evmAddress}</code>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
