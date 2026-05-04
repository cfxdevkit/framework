import { errMsg } from '@cfxdevkit/example-showcase-ui';
import {
  connect as fluentConnect,
  provider as fluentProvider,
  useAccount as useFluentAccount,
  useChainId as useFluentChainId,
  useStatus as useFluentStatus,
} from '@cfxjs/use-wallet-react/ethereum/Fluent';
import { useState } from 'react';
import { getFluentProvider, useCoreWallet } from '../lib/use-core-wallet.js';

function StatusBadge({ status }: { status: string | undefined }) {
  const colour =
    status === 'active'
      ? '#80ed99'
      : status === 'not-installed'
        ? '#ef233c'
        : status === 'not-active'
          ? '#adb5bd'
          : '#f4a261';
  return (
    <span
      className="mono"
      style={{
        fontSize: 11,
        padding: '2px 8px',
        borderRadius: 4,
        background: `${colour}22`,
        color: colour,
      }}
    >
      {status ?? 'detecting…'}
    </span>
  );
}

export function DualSpacePanel() {
  const {
    status: coreStatus,
    address: coreAccount,
    chainId: coreChainId,
    connect: coreConnect,
    isDetecting: coreIsDetecting,
    isConnecting: coreIsConnecting,
  } = useCoreWallet();

  const fluentStatus = useFluentStatus();
  const fluentAccount = useFluentAccount();
  const fluentChainId = useFluentChainId();

  const [error, setError] = useState<string | null>(null);
  const [crossNetResult, setCrossNetResult] = useState<Record<string, string> | null>(null);

  const doBothConnect = async () => {
    setError(null);
    // Connect Core if not yet active
    if (coreStatus === 'not-active') {
      try {
        await coreConnect();
      } catch (e) {
        setError(`Core connect: ${errMsg(e)}`);
        return;
      }
    }
    // Connect eSpace Fluent if not yet active
    if (fluentStatus === 'not-active') {
      try {
        await fluentConnect();
      } catch (e) {
        setError(`eSpace connect: ${errMsg(e)}`);
      }
    }
  };

  const doRequestCrossNet = async () => {
    setError(null);
    setCrossNetResult(null);
    try {
      const p = getFluentProvider();
      if (!p) throw new Error('Fluent Core provider not found');
      const result = await p.request({
        method: 'wallet_requestPermissions',
        params: [
          {
            wallet_accounts: {},
            wallet_crossNetworkTypeGetConfluxBase32Address: {},
            wallet_crossNetworkTypeGetEthereumHexAddress: {},
          },
        ],
      });
      setCrossNetResult(result as Record<string, string>);
    } catch (e) {
      setError(`requestCrossNetworkPermission: ${errMsg(e)}`);
    }
  };

  const bothActive = coreStatus === 'active' && fluentStatus === 'active';

  return (
    <section className="panel">
      <h2>Dual space — Core + eSpace</h2>
      <p className="panel-desc">
        Conflux has two co-existing address spaces. Fluent wallet exposes{' '}
        <strong>two separate providers</strong>: <code className="mono">window.conflux</code> (Core)
        and <code className="mono">window.fluent</code> (eSpace). Both can be connected
        simultaneously — this panel demonstrates that.
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 16,
          marginTop: 12,
        }}
      >
        {/* Core space card */}
        <div
          style={{
            padding: '12px 16px',
            border: '1px solid var(--border)',
            borderRadius: 8,
          }}
        >
          <h3 style={{ fontSize: 13, marginBottom: 8 }}>
            Core space
            <span className="mono" style={{ fontSize: 10, marginLeft: 8, color: 'var(--muted)' }}>
              window.conflux
            </span>
          </h3>
          <div className="row" style={{ gap: 8 }}>
            <span className="muted" style={{ fontSize: 12 }}>
              status:
            </span>
            <StatusBadge status={coreStatus} />
          </div>
          <div className="mono" style={{ fontSize: 12, marginTop: 6 }}>
            provider: {getFluentProvider() ? '✓ present' : '✗ null'}
          </div>
          <div className="mono" style={{ fontSize: 12 }}>
            account: {coreAccount ?? '—'}
          </div>
          <div className="mono" style={{ fontSize: 12 }}>
            chainId: {coreChainId ?? '—'}
          </div>
        </div>

        {/* eSpace card */}
        <div
          style={{
            padding: '12px 16px',
            border: '1px solid var(--border)',
            borderRadius: 8,
          }}
        >
          <h3 style={{ fontSize: 13, marginBottom: 8 }}>
            eSpace (EVM)
            <span className="mono" style={{ fontSize: 10, marginLeft: 8, color: 'var(--muted)' }}>
              window.fluent
            </span>
          </h3>
          <div className="row" style={{ gap: 8 }}>
            <span className="muted" style={{ fontSize: 12 }}>
              status:
            </span>
            <StatusBadge status={fluentStatus} />
          </div>
          <div className="mono" style={{ fontSize: 12, marginTop: 6 }}>
            provider: {fluentProvider ? '✓ present' : '✗ null'}
          </div>
          <div className="mono" style={{ fontSize: 12 }}>
            account: {fluentAccount ?? '—'}
          </div>
          <div className="mono" style={{ fontSize: 12 }}>
            chainId: {fluentChainId ?? '—'}
          </div>
        </div>
      </div>

      {error && (
        <div className="result" style={{ color: 'var(--err)', marginTop: 12 }}>
          {error}
        </div>
      )}

      <div className="row" style={{ marginTop: 16, gap: 8, flexWrap: 'wrap' }}>
        <button
          type="button"
          className="primary"
          onClick={doBothConnect}
          disabled={
            coreIsDetecting ||
            coreIsConnecting ||
            fluentStatus === 'in-detecting' ||
            fluentStatus === 'in-activating' ||
            bothActive
          }
        >
          {bothActive ? '✓ Both connected' : 'Connect both spaces'}
        </button>

        <button
          type="button"
          className="secondary"
          onClick={doRequestCrossNet}
          disabled={coreStatus !== 'active'}
          title="Requests permission to query eSpace state from the Core provider"
        >
          requestCrossNetworkPermission()
        </button>
      </div>

      {crossNetResult && (
        <div style={{ marginTop: 12 }}>
          <h3 style={{ fontSize: 13 }}>Cross-network permission result</h3>
          <div className="result mono" style={{ fontSize: 12 }}>
            {JSON.stringify(crossNetResult, null, 2)}
          </div>
        </div>
      )}

      <div className="result" style={{ marginTop: 16, fontSize: 12 }}>
        <strong>How it works</strong>
        {'\n'}
        Fluent exposes two independent providers. Connecting Core (window.conflux){'\n'}
        and eSpace (window.fluent) are separate operations. Both can be active{'\n'}
        at the same time — they are completely independent signers.{'\n'}
        {'\n'}
        requestCrossNetworkPermission() on the Core provider unlocks cross-space{'\n'}
        queries: you can call setCrossNetworkChain(chainId) afterwards to read{'\n'}
        balances or state from the other space within a single RPC session.
      </div>
    </section>
  );
}
