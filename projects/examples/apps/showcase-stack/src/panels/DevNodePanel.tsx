import { errMsg } from '@cfxdevkit/example-showcase-ui';
import { useCallback, useEffect, useState } from 'react';
import { useNetwork } from '../contexts/NetworkProvider.js';
import { api, type DevNodeStatusResponse } from '../lib/api.js';
import {
  DevNodeConfigPanel,
  DevNodeStatusBar,
  FaucetPanel,
  GenesisAccountsPanel,
} from './devnode-display.js';

const TEST_MNEMONIC = 'test test test test test test test test test test test junk';
const POLL_MS = 5_000;

export function DevNodePanel() {
  const { network } = useNetwork();
  const isLocal = network.id === 'local';

  const [status, setStatus] = useState<DevNodeStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  // Start options
  const [mnemonic, setMnemonic] = useState(TEST_MNEMONIC);
  const [accounts, setAccounts] = useState(5);
  const [miningIntervalMs, setMiningIntervalMs] = useState(500);

  // Mine options
  const [mineBlocks, setMineBlocks] = useState(1);
  const [minePack, setMinePack] = useState(false);

  const refresh = useCallback(async (signal?: AbortSignal) => {
    try {
      const s = await api.devnodeStatus(signal);
      if (!signal?.aborted) {
        setStatus(s);
        setError(null);
      }
    } catch (e) {
      if (!signal?.aborted && (e as { name?: string }).name !== 'AbortError') {
        setError(errMsg(e));
      }
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

  const run = async (action: string, apiFn: () => Promise<DevNodeStatusResponse>) => {
    setBusy(action);
    setError(null);
    try {
      setStatus(await apiFn());
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(null);
    }
  };

  const backendOffline = error !== null && status === null;
  const isRunning = status?.running === true;
  const isStopped = status?.status === 'stopped';

  return (
    <div>
      {!isLocal && (
        <div className="warning">
          Switch to <strong>Local</strong> network (top right) to use the devnode controls.
        </div>
      )}

      <DevNodeStatusBar
        backendOffline={backendOffline}
        busy={busy}
        status={status}
        refresh={() => void refresh()}
      />

      {/* Start form */}
      {!isRunning && (
        <div className="panel" style={{ marginBottom: 16 }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 600 }}>Start node</h3>
          <div className="row" style={{ marginBottom: 8 }}>
            <label style={{ flex: 1 }}>
              Mnemonic
              <input
                value={mnemonic}
                onChange={(e) => setMnemonic(e.target.value)}
                style={{ fontFamily: 'var(--mono)', fontSize: 11 }}
                placeholder="BIP-39 mnemonic (blank = random)"
              />
            </label>
          </div>
          <div className="row" style={{ marginBottom: 12 }}>
            <label>
              Accounts
              <input
                type="number"
                value={accounts}
                min={1}
                max={20}
                style={{ width: 70 }}
                onChange={(e) => setAccounts(Number(e.target.value))}
              />
            </label>
            <label>
              Mining interval (ms)
              <input
                type="number"
                value={miningIntervalMs}
                min={0}
                step={100}
                style={{ width: 100 }}
                onChange={(e) => setMiningIntervalMs(Number(e.target.value))}
              />
            </label>
            <button
              type="button"
              className="primary"
              style={{ alignSelf: 'flex-end' }}
              disabled={!isLocal || !!busy}
              onClick={() =>
                void run('start', () =>
                  api.devnodeStart({
                    ...(mnemonic.trim() ? { mnemonic: mnemonic.trim() } : {}),
                    accounts,
                    miningIntervalMs,
                  }),
                )
              }
            >
              {busy === 'start' ? 'Starting…' : 'Start'}
            </button>
          </div>
        </div>
      )}

      {/* Running controls */}
      {isRunning && (
        <div className="row" style={{ marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
          <button
            type="button"
            className="secondary"
            disabled={!!busy}
            onClick={() => void run('stop', () => api.devnodeStop())}
          >
            Stop
          </button>
          <button
            type="button"
            className="secondary"
            disabled={!!busy}
            onClick={() => void run('restart', () => api.devnodeRestart())}
          >
            Restart
          </button>
          <button
            type="button"
            className="secondary"
            style={{ color: 'var(--err)', borderColor: 'var(--err)' }}
            disabled={!!busy}
            onClick={() => {
              if (window.confirm('Wipe all chain data?')) {
                void run('wipe', () => api.devnodeWipe());
              }
            }}
          >
            Wipe
          </button>
        </div>
      )}

      {/* Mine section */}
      {isRunning && (
        <div className="panel" style={{ marginBottom: 16 }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 600 }}>Mine blocks</h3>
          <div className="row">
            <label>
              Blocks
              <input
                type="number"
                value={mineBlocks}
                min={1}
                max={100}
                style={{ width: 70 }}
                onChange={(e) => setMineBlocks(Number(e.target.value))}
              />
            </label>
            <label style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <input
                type="checkbox"
                checked={minePack}
                onChange={(e) => setMinePack(e.target.checked)}
              />
              Pack transactions
            </label>
            <button
              type="button"
              className="primary"
              style={{ alignSelf: 'flex-end' }}
              disabled={!!busy}
              onClick={() =>
                void run('mine', () => api.devnodeMine({ blocks: mineBlocks, pack: minePack }))
              }
            >
              {busy === 'mine' ? 'Mining…' : 'Mine'}
            </button>
          </div>
          {status?.mining && (
            <div className="muted" style={{ marginTop: 8, fontSize: 12 }}>
              Mining ticks: {status.mining.ticks} · interval: {status.mining.intervalMs}ms
            </div>
          )}
        </div>
      )}

      {status && <DevNodeConfigPanel status={status} />}
      <GenesisAccountsPanel accounts={status?.accounts} isStopped={isStopped} />
      <FaucetPanel faucet={status?.faucet} />

      {error && (
        <div className="result" style={{ color: 'var(--err)' }}>
          {error}
        </div>
      )}
    </div>
  );
}
