/**
 * EspaceFluentPanel — Conflux **eSpace** wallet via Fluent's
 * `window.fluent` provider (separate from `window.ethereum`!). Uses
 * `@cfxjs/use-wallet-react/ethereum/Fluent`.
 *
 * Even though eSpace is EVM-equivalent, Fluent injects its eSpace
 * provider on `window.fluent` so it can coexist with MetaMask on the
 * same page.
 */

import { errMsg, LogBox, useLogList } from '@cfxdevkit/example-showcase-ui';
import {
  connect as fluentConnect,
  provider as fluentProvider,
  useAccount as useFluentAccount,
  useChainId as useFluentChainId,
  useStatus as useFluentStatus,
} from '@cfxjs/use-wallet-react/ethereum/Fluent';
import { useEffect, useState } from 'react';

export function EspaceFluentPanel() {
  const status = useFluentStatus();
  const account = useFluentAccount();
  const chainId = useFluentChainId();
  const { entries, log, clear } = useLogList();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    log(`status → ${status ?? 'undefined'}`);
  }, [status, log]);
  useEffect(() => {
    if (account !== undefined) log(`account → ${account ?? 'null'}`);
  }, [account, log]);
  useEffect(() => {
    if (chainId !== undefined) log(`chainId → ${chainId ?? 'null'}`);
  }, [chainId, log]);

  const doConnect = async () => {
    if (status !== 'not-active') {
      log(`connect() skipped — status=${status}`, 'warn');
      return;
    }
    setError(null);
    log('connect() called');
    try {
      await fluentConnect();
      log('connect() resolved ✓');
    } catch (e) {
      const m = errMsg(e);
      setError(m);
      log(`connect() error: ${m}`, 'error');
    }
  };

  const isLoading = status === 'in-detecting' || status === 'in-activating';
  const connectLabel =
    status === 'in-detecting'
      ? 'Detecting…'
      : status === 'in-activating'
        ? 'Connecting…'
        : status === 'active'
          ? '✓ Connected'
          : status === 'not-installed'
            ? 'Fluent not installed'
            : 'Connect Fluent (eSpace)';

  return (
    <section className="panel">
      <h2>Conflux eSpace · Fluent</h2>
      <p className="panel-desc">
        <code className="mono">@cfxjs/use-wallet-react/ethereum/Fluent</code> — detects{' '}
        <code className="mono">window.fluent</code> (NOT{' '}
        <code className="mono">window.ethereum</code>). Coexists with MetaMask on the same page.
        Uses standard <code className="mono">eth_*</code> RPC and 0x hex addresses.
      </p>

      <div className="row" style={{ gap: 12, marginTop: 8 }}>
        <span className="muted">status:</span>
        <span className="mono">{status ?? 'undefined'}</span>
        <span className="muted">provider:</span>
        <span className="mono">{fluentProvider ? 'present' : 'null'}</span>
      </div>
      <div className="result">
        account : {account ?? 'null'}
        {'\n'}chainId : {chainId ?? 'null'}
      </div>

      {error && (
        <div className="result" style={{ color: 'var(--err)' }}>
          {error}
        </div>
      )}

      <div className="row" style={{ marginTop: 12, gap: 8 }}>
        <button
          type="button"
          className="primary"
          onClick={doConnect}
          disabled={isLoading || status === 'active' || status === 'not-installed'}
        >
          {connectLabel}
        </button>
        <button type="button" className="secondary" onClick={clear}>
          Clear log
        </button>
      </div>

      <h3 style={{ fontSize: 13, marginTop: 16 }}>Events</h3>
      <LogBox entries={entries} />
    </section>
  );
}
