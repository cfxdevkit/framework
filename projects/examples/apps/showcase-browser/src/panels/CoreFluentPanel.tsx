/**
 * CoreFluentPanel — Conflux **Core space** wallet via Fluent's
 * `window.conflux` provider. Uses the local direct Core hook which speaks
 * the `cfx_*` JSON-RPC dialect and base32 addresses.
 *
 * `wagmi` does NOT cover this — wagmi assumes EVM (`eth_*`). For users on
 * Core space this is the only first-class browser path today.
 *
 * Status semantics:
 *   not-installed → no provider on window
 *   not-active    → provider present, no accounts authorised
 *   detecting     → first provider scan in progress
 *   connecting    → cfx_requestAccounts pending
 *   active        → at least one authorised account
 */

import { errMsg, LogBox, useLogList } from '@cfxdevkit/example-showcase-ui';
import { useEffect, useState } from 'react';
import { NETWORKS, useNetwork } from '../contexts/NetworkContext.js';
import {
  CORE_CHAIN_CONFIGS,
  getCoreChainConfig,
  getFluentProvider,
  useCoreWallet,
} from '../lib/use-core-wallet.js';

export function CoreFluentPanel() {
  const {
    status,
    address: account,
    chainId,
    isDetecting,
    isConnecting,
    isConnected,
    isInstalled,
    connect,
    switchChain,
  } = useCoreWallet();
  const { entries, log, clear } = useLogList();
  const { network } = useNetwork();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    log(`status → ${status ?? 'undefined'}`);
  }, [status, log]);
  useEffect(() => {
    if (account !== null) log(`account → ${account ?? 'null'}`);
  }, [account, log]);
  useEffect(() => {
    if (chainId !== null) log(`chainId → ${chainId ?? 'null'}`);
  }, [chainId, log]);

  const doConnect = async () => {
    if (status !== 'not-active') {
      log(`connect() skipped — status=${status}`, 'warn');
      return;
    }
    setError(null);
    log('connect() called');
    try {
      await connect();
      log('connect() resolved ✓');
    } catch (e) {
      const m = errMsg(e);
      setError(m);
      log(`connect() error: ${m}`, 'error');
    }
  };

  const doAddTestnet = async () => {
    log('switchChain(Core testnet)');
    try {
      const testnet = CORE_CHAIN_CONFIGS[1];
      if (!testnet) throw new Error('Core testnet config not found');
      await switchChain(testnet);
      log('switchChain(testnet) ✓');
    } catch (e) {
      log(`switchChain error: ${errMsg(e)}`, 'error');
    }
  };

  const doSwitch = (hexId: string) => async () => {
    const config = getCoreChainConfig(hexId);
    if (!config) {
      log(`switchChain: unknown chain ${hexId}`, 'warn');
      return;
    }
    log(`switchChain(${hexId})`);
    try {
      await switchChain(config);
      log('switchChain ✓');
    } catch (e) {
      log(`switchChain error: ${errMsg(e)}`, 'error');
    }
  };

  const isLoading = isDetecting || isConnecting;
  const connectLabel = isDetecting
    ? 'Detecting…'
    : isConnecting
      ? 'Connecting…'
      : isConnected
        ? '✓ Connected'
        : !isInstalled
          ? 'Fluent not installed'
          : 'Connect Fluent (Core)';

  return (
    <section className="panel">
      <h2>Conflux Core · Fluent</h2>
      <p className="panel-desc">
        Internal <code className="mono">useCoreWallet</code> hook — drives{' '}
        <code className="mono">window.conflux</code> directly. Speaks the Conflux Core{' '}
        <code className="mono">cfx_*</code> JSON-RPC dialect and returns{' '}
        <strong>base32 addresses</strong> (e.g. <code className="mono">cfx:aam…</code>).
      </p>

      <div className="row" style={{ gap: 12, marginTop: 8 }}>
        <span className="muted">status:</span>
        <span className="mono">{status ?? 'undefined'}</span>
        <span className="muted">provider:</span>
        <span className="mono">{getFluentProvider() ? 'present' : 'null'}</span>
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

      <div className="row" style={{ marginTop: 12, gap: 8, flexWrap: 'wrap' }}>
        <button
          type="button"
          className="primary"
          onClick={doConnect}
          disabled={isLoading || isConnected || !isInstalled}
        >
          {connectLabel}
        </button>
        <button type="button" className="secondary" onClick={doAddTestnet} disabled={!isInstalled}>
          Add testnet
        </button>
        {NETWORKS.map((n) => (
          <button
            key={n.id}
            type="button"
            className={`secondary${network.id === n.id ? ' active' : ''}`}
            onClick={doSwitch(n.coreChainIdHex)}
            disabled={!isInstalled}
          >
            Switch → {n.label} ({n.coreChainIdDecimal})
          </button>
        ))}
        <button type="button" className="secondary" onClick={clear}>
          Clear log
        </button>
      </div>

      <h3 style={{ fontSize: 13, marginTop: 16 }}>Events</h3>
      <LogBox entries={entries} />
    </section>
  );
}
