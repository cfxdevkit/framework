import { type ChainConfig, createClient, http, listChains } from '@cfxdevkit/core';
import { errMsg } from '@cfxdevkit/example-showcase-ui';
import { useCallback, useEffect, useState } from 'react';

interface Row {
  chain: ChainConfig;
  state: 'pending' | 'ok' | 'err';
  head?: string;
  latencyMs?: number;
  error?: string;
}

async function ping(
  chain: ChainConfig,
): Promise<Omit<Row, 'chain' | 'state'> & { state: 'ok' | 'err' }> {
  const start = Date.now();
  try {
    const transport = http({ timeoutMs: 10_000 });
    const client = createClient({ chain, transport });
    const head =
      client.family === 'core' ? await client.getEpochNumber() : await client.getBlockNumber();
    return { state: 'ok', head: head.toString(), latencyMs: Date.now() - start };
  } catch (e) {
    return {
      state: 'err',
      latencyMs: Date.now() - start,
      error: errMsg(e),
    };
  }
}

/**
 * Browser-only network status. Pings every public chain in
 * `listChains()` (mainnet + testnet, both spaces) directly from the
 * browser via `http()`. Local devnets are excluded — they require a
 * Node-side proxy because xcfx's RPC does not implement CORS.
 */
export function StatusPanel() {
  const [rows, setRows] = useState<Row[]>([]);
  const [running, setRunning] = useState(false);

  const runAll = useCallback(async () => {
    const chains = listChains().filter((c) => c.network !== 'local');
    setRows(chains.map((chain) => ({ chain, state: 'pending' })));
    setRunning(true);
    const results = await Promise.all(chains.map((c) => ping(c).then((r) => ({ chain: c, ...r }))));
    setRows(results);
    setRunning(false);
  }, []);

  useEffect(() => {
    void runAll();
  }, [runAll]);

  return (
    <section className="panel">
      <h2>Live network status</h2>
      <p className="panel-desc">
        Pings every public chain in <code className="mono">listChains()</code> using{' '}
        <code className="mono">createClient + http()</code>. eSpace chains report{' '}
        <code className="mono">getBlockNumber()</code>; Core Space chains report{' '}
        <code className="mono">getEpochNumber()</code>. Requests run in parallel from your browser.
        Local devnets are excluded (they require a CORS proxy).
      </p>

      <div className="row" style={{ marginBottom: 12 }}>
        <button type="button" className="primary" onClick={runAll} disabled={running}>
          {running ? 'Pinging…' : 'Refresh all'}
        </button>
      </div>

      <table className="status-table">
        <thead>
          <tr>
            <th></th>
            <th>Chain</th>
            <th>ID</th>
            <th>Family</th>
            <th>Head</th>
            <th>Latency</th>
            <th>RPC</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ chain, state, head, latencyMs, error }) => (
            <tr key={chain.id}>
              <td>
                <span className={`dot ${state}`} title={state} />
              </td>
              <td>{chain.name}</td>
              <td>{chain.id}</td>
              <td>{chain.family}</td>
              <td>{head ?? (state === 'pending' ? '…' : '—')}</td>
              <td>{latencyMs !== undefined ? `${latencyMs} ms` : ''}</td>
              <td className="muted" style={{ fontSize: 11 }}>
                {chain.rpc.http[0]}
                {error && <div style={{ color: 'var(--err)' }}>{error}</div>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
