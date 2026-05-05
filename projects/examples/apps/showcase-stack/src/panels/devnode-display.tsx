import { CopyButton } from '@cfxdevkit/example-showcase-ui';
import type {
  DevNodeAccountResponse,
  DevNodeAccountsResponse,
  DevNodeStatusResponse,
} from '../lib/api.js';

function statusColor(status: DevNodeStatusResponse['status'] | undefined): string {
  if (status === 'running') return 'var(--accent-2)';
  if (status === 'starting' || status === 'stopping') return 'var(--warn)';
  if (status === 'error') return 'var(--err)';
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

export function DevNodeStatusBar({
  backendOffline,
  busy,
  status,
  refresh,
}: {
  backendOffline: boolean;
  busy: string | null;
  status: DevNodeStatusResponse | null;
  refresh: () => void;
}) {
  return (
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
        onClick={refresh}
      >
        Refresh
      </button>
    </div>
  );
}

export function DevNodeConfigPanel({ status }: { status: DevNodeStatusResponse }) {
  if (!status.config) return null;
  return (
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
        </tbody>
      </table>
    </div>
  );
}

export function GenesisAccountsPanel({
  accountsData,
  isStopped,
}: {
  accountsData: DevNodeAccountsResponse | null | undefined;
  isStopped: boolean;
}) {
  const accounts = accountsData?.accounts;
  if (isStopped)
    return (
      <div className="panel" style={{ marginBottom: 16 }}>
        <h3 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600 }}>Genesis accounts</h3>
        <div className="muted" style={{ fontSize: 12 }}>
          Start the devnode to see genesis accounts.
        </div>
      </div>
    );
  if (!accounts?.length) return null;
  return (
    <div className="panel" style={{ marginBottom: 16 }}>
      <h3 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600 }}>Genesis accounts</h3>
      <p className="muted" style={{ fontSize: 12, marginBottom: 12 }}>
        Copy a private key and use it in the Session Key panel (parentPrivateKey) or import it into
        MetaMask / Fluent to get funded eSpace/Core accounts on the local devnode.
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
              {accounts.map((acc) => (
                <AccountRow key={acc.index} acc={acc} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function FaucetPanel({
  accountsData,
}: {
  accountsData: DevNodeAccountsResponse | null | undefined;
}) {
  const faucet = accountsData?.faucet;
  if (!faucet) return null;
  return (
    <div className="panel">
      <h3 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600 }}>Faucet account</h3>
      <div className="row">
        <span className="mono" style={{ fontSize: 11 }}>
          {faucet.evmAddress}
        </span>
        <span>{faucet.initialBalanceCfx} CFX</span>
        <CopyButton text={faucet.privateKey} label="copy pk" />
        <CopyButton text={faucet.evmAddress} label="copy addr" />
      </div>
    </div>
  );
}
