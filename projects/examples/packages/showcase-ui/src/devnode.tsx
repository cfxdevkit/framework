import { useCallback, useEffect, useState } from 'react';

export interface SharedDevNodeStatus {
  status: 'stopped' | 'starting' | 'running' | 'stopping' | 'error';
  running: boolean;
  urls?: { core: string; espace: string; coreWs?: string; espaceWs?: string };
  config?: { chainId: number; evmChainId: number; accounts: number };
}

type Health = 'checking' | 'online' | 'offline';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init);
  const payload = (await response.json()) as T & { error?: string };
  if (!response.ok || payload.error)
    throw new Error(payload.error ?? `${init?.method ?? 'GET'} ${path} failed`);
  return payload;
}

export function useShowcaseBackend(input: { apiBase?: string; pollMs?: number } = {}) {
  const apiBase = input.apiBase ?? '/api';
  const pollMs = input.pollMs ?? 5_000;
  const [health, setHealth] = useState<Health>('checking');
  const [devnode, setDevnode] = useState<SharedDevNodeStatus | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');

  const refresh = useCallback(async () => {
    try {
      await request(`${apiBase}/health`);
      const status = await request<SharedDevNodeStatus>(`${apiBase}/devnode/status`);
      setHealth('online');
      setDevnode(status);
      setError('');
    } catch (cause) {
      setHealth('offline');
      setDevnode(null);
      setError(cause instanceof Error ? cause.message : String(cause));
    }
  }, [apiBase]);

  const run = useCallback(
    async (action: 'start' | 'stop' | 'restart' | 'mine') => {
      setBusy(action);
      setError('');
      try {
        const path = action === 'mine' ? `${apiBase}/devnode/mine` : `${apiBase}/devnode/${action}`;
        const body =
          action === 'start'
            ? { miningIntervalMs: 0 }
            : action === 'mine'
              ? { pack: true }
              : undefined;
        const init: RequestInit = {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
        };
        if (body) init.body = JSON.stringify(body);
        const status = await request<SharedDevNodeStatus>(path, init);
        setHealth('online');
        setDevnode(status);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : String(cause));
      } finally {
        setBusy('');
      }
    },
    [apiBase],
  );

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), pollMs);
    return () => window.clearInterval(timer);
  }, [pollMs, refresh]);

  return { health, devnode, error, busy, refresh, run };
}

export function ShowcaseOpsPanel(props: { apiBase?: string }) {
  const backend = useShowcaseBackend(props.apiBase ? { apiBase: props.apiBase } : {});
  const dot = backend.health === 'online' ? 'ok' : backend.health === 'offline' ? 'err' : 'warn';
  return (
    <section className="showcase-ops-grid" aria-label="Showcase operations">
      <div className="showcase-op-card">
        <span>Backend</span>
        <strong>{backend.health}</strong>
        <div className="showcase-status-line">
          <span className={`showcase-status-dot ${dot}`} />
          <span>{backend.error || 'same-origin gateway route'}</span>
        </div>
        <div className="showcase-op-actions">
          <button
            type="button"
            onClick={() => void backend.refresh()}
            disabled={Boolean(backend.busy)}
          >
            Refresh
          </button>
          <a href="/api/health">Health</a>
        </div>
      </div>
      <div className="showcase-op-card">
        <span>Devnode</span>
        <strong>{backend.devnode?.status ?? 'unknown'}</strong>
        <div className="showcase-status-line">
          <span className={`showcase-status-dot ${backend.devnode?.running ? 'ok' : 'warn'}`} />
          <span>{backend.devnode?.running ? 'local Core/eSpace ready' : 'not running'}</span>
        </div>
        <div className="showcase-op-actions">
          <button
            className="primary"
            type="button"
            onClick={() => void backend.run('start')}
            disabled={Boolean(backend.busy) || backend.devnode?.running === true}
          >
            Start
          </button>
          <button
            type="button"
            onClick={() => void backend.run('mine')}
            disabled={Boolean(backend.busy) || !backend.devnode?.running}
          >
            Mine
          </button>
          <button
            type="button"
            onClick={() => void backend.run('stop')}
            disabled={Boolean(backend.busy) || !backend.devnode?.running}
          >
            Stop
          </button>
        </div>
      </div>
      <div className="showcase-op-card">
        <span>Sections</span>
        <strong>Backend · Browser · Combined · Signers</strong>
        <div className="showcase-status-line">
          <span className="showcase-status-dot ok" />
          <span>Four showcases covering the full SDK surface.</span>
        </div>
        <div className="showcase-op-actions">
          <a href="/showcase/">Backend</a>
          <a href="/browser/">Browser</a>
          <a href="/stack/">Combined</a>
          <a href="/keystores/">Signers</a>
        </div>
      </div>
    </section>
  );
}

export function SharedDevNodePill(props: { apiBase?: string }) {
  const backend = useShowcaseBackend(props.apiBase ? { apiBase: props.apiBase } : {});
  const [open, setOpen] = useState(false);

  let dotClass = 'showcase-status-dot';
  let label = 'backend …';
  if (backend.health === 'offline') {
    dotClass += ' err';
    label = 'backend offline';
  } else if (backend.health === 'online') {
    if (backend.devnode?.running) {
      dotClass += ' ok';
      label = 'devnode running';
    } else {
      dotClass += ' warn';
      label = backend.devnode ? `devnode ${backend.devnode.status}` : 'backend online';
    }
  }

  return (
    <div className="pill-wrap">
      <button type="button" className="pill" onClick={() => setOpen((v) => !v)}>
        <span className={dotClass} />
        <span className="pill-label">{label}</span>
      </button>
      {open && (
        <div className="popover" style={{ minWidth: 260 }}>
          <div className="popover-section">
            <div className="popover-row">
              <span className="popover-key">backend</span>
              <span className="popover-val">
                {backend.health === 'checking' ? '…' : backend.health}
              </span>
            </div>
            {backend.devnode && (
              <>
                <div className="popover-row">
                  <span className="popover-key">devnode</span>
                  <span className="popover-val">{backend.devnode.status}</span>
                </div>
                {backend.devnode.config && (
                  <div className="popover-row">
                    <span className="popover-key">eSpace chain</span>
                    <span className="popover-val mono">{backend.devnode.config.evmChainId}</span>
                  </div>
                )}
              </>
            )}
            {backend.error && (
              <div className="popover-row">
                <span className="popover-val" style={{ color: 'var(--err)', fontSize: 11 }}>
                  {backend.error}
                </span>
              </div>
            )}

            <div className="row" style={{ gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
              <button
                type="button"
                className="small"
                disabled={!!backend.busy}
                onClick={() => void backend.refresh()}
              >
                Refresh
              </button>
              <button
                type="button"
                className="primary small"
                disabled={!!backend.busy || backend.devnode?.running}
                onClick={() => void backend.run('start')}
              >
                Start
              </button>
              <button
                type="button"
                className="small"
                disabled={!!backend.busy || !backend.devnode?.running}
                onClick={() => void backend.run('stop')}
              >
                Stop
              </button>
            </div>
          </div>
          <button type="button" className="popover-close" onClick={() => setOpen(false)}>
            close
          </button>
        </div>
      )}
    </div>
  );
}
