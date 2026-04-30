/**
 * BackendPill — header pill that polls the backend health endpoint and
 * shows a quick devnode status badge. Clicking opens a small popover
 * with last-known status details.
 */
import { useCallback, useEffect, useState } from 'react';
import { api, type DevNodeStatusResponse } from '../lib/api.js';

interface BackendState {
  healthy: boolean | null;
  devnode: DevNodeStatusResponse | null;
  error: string | null;
}

export function BackendPill() {
  const [state, setState] = useState<BackendState>({ healthy: null, devnode: null, error: null });
  const [open, setOpen] = useState(false);

  const refresh = useCallback(async (signal?: AbortSignal) => {
    try {
      await api.health(signal);
      const devnode = await api.devnodeStatus(signal);
      if (!signal?.aborted) {
        setState({ healthy: true, devnode, error: null });
      }
    } catch (e) {
      if (!signal?.aborted) {
        setState({
          healthy: false,
          devnode: null,
          error: e instanceof Error ? e.message : String(e),
        });
      }
    }
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    void refresh(ctrl.signal);
    const t = window.setInterval(() => void refresh(), 5_000);
    return () => {
      ctrl.abort();
      window.clearInterval(t);
    };
  }, [refresh]);

  const { healthy, devnode } = state;

  let dotClass = 'dot dot-gray';
  let label = 'backend …';
  if (healthy === false) {
    dotClass = 'dot dot-red';
    label = 'backend offline';
  } else if (healthy === true) {
    if (devnode?.running) {
      dotClass = 'dot dot-green';
      label = 'devnode running';
    } else {
      dotClass = 'dot dot-amber';
      label = devnode ? `devnode ${devnode.status}` : 'backend online';
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
                {healthy === null ? '…' : healthy ? 'online' : 'offline'}
              </span>
            </div>
            {devnode && (
              <>
                <div className="popover-row">
                  <span className="popover-key">devnode</span>
                  <span className="popover-val">{devnode.status}</span>
                </div>
                {devnode.config && (
                  <>
                    <div className="popover-row">
                      <span className="popover-key">eSpace chain</span>
                      <span className="popover-val mono">{devnode.config.evmChainId}</span>
                    </div>
                    <div className="popover-row">
                      <span className="popover-key">accounts</span>
                      <span className="popover-val">{devnode.config.accounts}</span>
                    </div>
                  </>
                )}
                {devnode.mining && (
                  <div className="popover-row">
                    <span className="popover-key">mining ticks</span>
                    <span className="popover-val">{devnode.mining.ticks}</span>
                  </div>
                )}
              </>
            )}
            {state.error && (
              <>
                <div className="popover-row">
                  <span className="popover-val" style={{ color: 'var(--err)', fontSize: 11 }}>
                    {state.error}
                  </span>
                </div>
                <div className="popover-row" style={{ alignItems: 'flex-start' }}>
                  <span className="popover-key">start</span>
                  <code className="popover-val" style={{ whiteSpace: 'pre-wrap' }}>
                    pnpm --filter @cfxdevkit/example-showcase-backend dev
                  </code>
                </div>
                <div className="popover-row" style={{ alignItems: 'flex-start' }}>
                  <span className="popover-key">url</span>
                  <code className="popover-val">{api.baseUrl}</code>
                </div>
              </>
            )}
          </div>
          <button type="button" className="popover-close" onClick={() => setOpen(false)}>
            close
          </button>
        </div>
      )}
    </div>
  );
}
