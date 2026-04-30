/**
 * DevNodePanel — full lifecycle control for the local Conflux devnode.
 *
 * Covers: start (with custom mnemonic / accounts / mining config),
 * stop, restart, wipe, mine N blocks, view genesis accounts + copy keys.
 */

import { CopyButton, errMsg } from '@cfxdevkit/example-showcase-ui';
import { useCallback, useEffect, useState } from 'react';
import { useNetwork } from '../contexts/NetworkProvider.js';
import { api, type DevNodeAccountResponse, type DevNodeStatusResponse } from '../lib/api.js';

const TEST_MNEMONIC = 'test test test test test test test test test test test junk';
const POLL_MS = 5_000;

function statusColor(s: DevNodeStatusResponse['status'] | undefined): string {
  if (s === 'running') return 'var(--accent-2)';
  if (s === 'starting' || s === 'stopping') return 'var(--warn)';
  if (s === 'error') return 'var(--err)';
  return 'var(--muted)';
}

function AccountRow({ acc }: { acc: DevNodeAccountResponse }) {
  return (
    <tr>
      <td>{acc.index}</td>
      <td className="mono">{acc.evmAddress}</td>
      <td className="mono">{acc.initialBalanceCfx} CFX</td>
      <td>
        <CopyButton text={acc.privateKey} label="pk" />
        <CopyButton text={acc.evmAddress} label="addr" />
      </td>
    </tr>
  );
}

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

      {/* Status badge */}
      <div className="row" style={{ marginBottom: 16 }}>
        <span
          className="dot"
          style={{
            background: backendOffline ? 'var(--err)' : statusColor(status?.status),
            display: 'inline-block',
            width: 10,
            height: 10,
            borderRadius: '50%',
          }}
        />
        <span className="mono" style={{ fontSize: 13 }}>
          {backendOffline ? 'backend offline' : busy ? `${busy}…` : (status?.status ?? '…')}
        </span>
        {status?.running && status.config && (
          <span className="muted" style={{ fontSize: 12 }}>
            · Core :{status.config.coreRpcPort} / eSpace :{status.config.evmRpcPort}
          </span>
        )}
        <button
          type="button"
          className="secondary"
          style={{ marginLeft: 'auto', padding: '4px 10px', fontSize: 11 }}
          disabled={!!busy}
          onClick={() => void refresh()}
        >
          Refresh
        </button>
      </div>

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

      {/* Config */}
      {status?.config && (
        <div className="panel" style={{ marginBottom: 16 }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 600 }}>Node config</h3>
          <table className="status-table">
            <tbody>
              <tr>
                <th>Core chain ID</th>
                <td className="mono">{status.config.chainId}</td>
              </tr>
              <tr>
                <th>eSpace chain ID</th>
                <td className="mono">{status.config.evmChainId}</td>
              </tr>
              <tr>
                <th>Accounts</th>
                <td>{status.config.accounts}</td>
              </tr>
              <tr>
                <th>Balance / account</th>
                <td>{status.config.balanceCfx} CFX</td>
              </tr>
              <tr>
                <th>Mnemonic</th>
                <td>
                  <span className="mono" style={{ fontSize: 11 }}>
                    {status.config.mnemonic}
                  </span>
                  <CopyButton text={status.config.mnemonic} />
                </td>
              </tr>
              <tr>
                <th>Data dir</th>
                <td className="mono" style={{ fontSize: 11 }}>
                  {status.config.dataDir}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Genesis accounts */}
      {status?.accounts && status.accounts.length > 0 && (
        <div className="panel" style={{ marginBottom: 16 }}>
          <h3 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600 }}>Genesis accounts</h3>
          <p className="muted" style={{ fontSize: 12, marginBottom: 12 }}>
            Copy a private key and use it in the Session Key panel (parentPrivateKey) or import it
            into MetaMask / Fluent to get funded eSpace/Core accounts on the local devnode.
          </p>
          {isStopped ? (
            <div className="muted" style={{ fontSize: 12 }}>
              Start the devnode to see genesis accounts.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="status-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>eSpace address</th>
                    <th>Balance</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {status.accounts.map((acc) => (
                    <AccountRow key={acc.index} acc={acc} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Faucet account */}
      {status?.faucet && (
        <div className="panel">
          <h3 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600 }}>Faucet account</h3>
          <div className="row">
            <span className="mono" style={{ fontSize: 11 }}>
              {status.faucet.evmAddress}
            </span>
            <span>{status.faucet.initialBalanceCfx} CFX</span>
            <CopyButton text={status.faucet.privateKey} label="copy pk" />
            <CopyButton text={status.faucet.evmAddress} label="copy addr" />
          </div>
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
