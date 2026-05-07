/**
 * StatusPanel — live RPC health for Core + eSpace and backend reachability.
 */
import { useCallback, useEffect, useState } from 'react';
import { useNetwork } from '../contexts/NetworkProvider.js';
import { api } from '../lib/api.js';

interface SpaceStatus {
  blockNumber: string | null;
  latency: number | null;
  error: string | null;
}

export function StatusPanel() {
  const { network, coreClient, espaceClient } = useNetwork();
  const [core, setCore] = useState<SpaceStatus>({ blockNumber: null, latency: null, error: null });
  const [espace, setEspace] = useState<SpaceStatus>({
    blockNumber: null,
    latency: null,
    error: null,
  });
  const [backendOk, setBackendOk] = useState<boolean | null>(null);
  const [backendLatency, setBackendLatency] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    // Backend health
    const t0b = Date.now();
    api
      .health()
      .then(() => {
        setBackendOk(true);
        setBackendLatency(Date.now() - t0b);
      })
      .catch(() => {
        setBackendOk(false);
        setBackendLatency(null);
      });

    // Core block
    const t0c = Date.now();
    if (coreClient.family === 'core') {
      coreClient
        .getEpochNumber({ epochTag: 'latest_mined' })
        .then((epoch) => {
          setCore({ blockNumber: epoch.toString(), latency: Date.now() - t0c, error: null });
        })
        .catch((e: unknown) => {
          setCore({
            blockNumber: null,
            latency: null,
            error: e instanceof Error ? e.message : String(e),
          });
        });
    }

    // eSpace block
    const t0e = Date.now();
    if (espaceClient.family === 'espace') {
      espaceClient
        .getBlockNumber()
        .then((blockNumber) => {
          setEspace({
            blockNumber: blockNumber.toString(),
            latency: Date.now() - t0e,
            error: null,
          });
        })
        .catch((e: unknown) => {
          setEspace({
            blockNumber: null,
            latency: null,
            error: e instanceof Error ? e.message : String(e),
          });
        });
    }
  }, [coreClient, espaceClient]);

  useEffect(() => {
    void refresh();
    const t = window.setInterval(() => void refresh(), 10_000);
    return () => window.clearInterval(t);
  }, [refresh]);

  function row(label: string, chainId: number, s: SpaceStatus) {
    return (
      <tr key={label}>
        <td>
          <span className="space-badge">{label}</span>
        </td>
        <td className="mono">{chainId}</td>
        <td className="mono">{s.blockNumber ?? <span className="muted">—</span>}</td>
        <td>{s.latency !== null ? `${s.latency}ms` : <span className="muted">—</span>}</td>
        <td>
          {s.error ? (
            <span style={{ color: 'var(--err)', fontSize: 11 }}>{s.error}</span>
          ) : (
            <span style={{ color: 'var(--accent-2)' }}>ok</span>
          )}
        </td>
      </tr>
    );
  }

  return (
    <div>
      <div className="row" style={{ marginBottom: 16 }}>
        <strong style={{ fontSize: 13 }}>Network: {network.label}</strong>
        <button
          type="button"
          className="secondary"
          style={{ marginLeft: 'auto', padding: '4px 10px', fontSize: 11 }}
          onClick={() => void refresh()}
        >
          Refresh
        </button>
      </div>

      <table className="status-table">
        <thead>
          <tr>
            <th>Space</th>
            <th>Chain ID</th>
            <th>Block / Epoch</th>
            <th>Latency</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {row('Core', network.core.id, core)}
          {row('eSpace', network.espace.id, espace)}
        </tbody>
      </table>

      <div className="panel" style={{ marginTop: 16 }}>
        <div className="row">
          <span className="muted" style={{ fontSize: 12 }}>
            Backend (showcase-backend :5174)
          </span>
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
          <span style={{ fontSize: 12 }}>
            {backendOk === null ? '…' : backendOk ? `online (${backendLatency}ms)` : 'offline'}
          </span>
        </div>
      </div>
    </div>
  );
}
