import { errMsg } from '@cfxdevkit/example-showcase-ui';
import { useCallback, useEffect, useState } from 'react';
import { useNetwork } from '../contexts/NetworkProvider.js';
import { api, type DevNodeAccountsResponse, type DevNodeStatusResponse } from '../lib/api.js';
import {
  DevNodeConfigPanel,
  DevNodeStatusBar,
  FaucetPanel,
  GenesisAccountsPanel,
} from './devnode-display.js';
import { DevNodeMineSection, DevNodeStartForm } from './devnode-forms.js';

const TEST_MNEMONIC = 'test test test test test test test test test test test junk';
const POLL_MS = 5_000;

export function DevNodePanel() {
  const { network } = useNetwork();
  const isLocal = network.id === 'local';

  const [status, setStatus] = useState<DevNodeStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [accountsData, setAccountsData] = useState<DevNodeAccountsResponse | null>(null);
  const [accountsError, setAccountsError] = useState<string | null>(null);
  const [accountsBusy, setAccountsBusy] = useState(false);

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
        // Clear cached accounts when node stops
        if (!s.running) setAccountsData(null);
      }
    } catch (e) {
      if (!signal?.aborted && (e as { name?: string }).name !== 'AbortError') {
        setError(errMsg(e));
      }
    }
  }, []);

  const fetchAccounts = useCallback(async () => {
    setAccountsBusy(true);
    setAccountsError(null);
    try {
      setAccountsData(await api.devnodeAccounts());
    } catch (e) {
      setAccountsError(errMsg(e));
    } finally {
      setAccountsBusy(false);
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
      const s = await apiFn();
      setStatus(s);
      // Clear cached accounts after lifecycle changes
      if (action === 'stop' || action === 'wipe' || action === 'restart') setAccountsData(null);
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
        <DevNodeStartForm
          isLocal={isLocal}
          busy={busy}
          mnemonic={mnemonic}
          setMnemonic={setMnemonic}
          accounts={accounts}
          setAccounts={setAccounts}
          miningIntervalMs={miningIntervalMs}
          setMiningIntervalMs={setMiningIntervalMs}
          onStart={() =>
            void run('start', () =>
              api.devnodeStart({
                ...(mnemonic.trim() ? { mnemonic: mnemonic.trim() } : {}),
                accounts,
                miningIntervalMs,
              }),
            )
          }
        />
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
        <DevNodeMineSection
          busy={busy}
          mineBlocks={mineBlocks}
          setMineBlocks={setMineBlocks}
          minePack={minePack}
          setMinePack={setMinePack}
          mining={status?.mining}
          onMine={() =>
            void run('mine', () => api.devnodeMine({ blocks: mineBlocks, pack: minePack }))
          }
        />
      )}

      {status && <DevNodeConfigPanel status={status} />}

      {isRunning && (
        <div className="panel" style={{ marginBottom: 16 }}>
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>Genesis accounts</h3>
            <button
              type="button"
              className="secondary"
              style={{ padding: '4px 10px', fontSize: 11 }}
              disabled={accountsBusy}
              onClick={() => void fetchAccounts()}
            >
              {accountsBusy ? 'Loading…' : accountsData ? 'Refresh' : 'Reveal accounts'}
            </button>
          </div>
          {accountsError && (
            <div style={{ color: 'var(--err)', fontSize: 12 }}>{accountsError}</div>
          )}
        </div>
      )}

      <GenesisAccountsPanel accountsData={accountsData} isStopped={isStopped} />
      <FaucetPanel accountsData={accountsData} />

      {error && (
        <div className="result" style={{ color: 'var(--err)' }}>
          {error}
        </div>
      )}
    </div>
  );
}
