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
        <span>Coverage</span>
        <strong>Core + eSpace + wallets + compiler</strong>
        <div className="showcase-status-line">
          <span className="showcase-status-dot ok" />
          <span>Use the linear sections below to walk the codebase surface.</span>
        </div>
        <div className="showcase-op-actions">
          <a href="/showcase/">SDK</a>
          <a href="/stack/">Stack</a>
          <a href="/hardware/">Hardware</a>
        </div>
      </div>
    </section>
  );
}
