import type { DevNodeAccountsResponse, DevNodeStatusResponse } from '../lib/api.js';

type Action = 'start' | 'stop' | 'restart' | 'wipe' | null;

type Props = {
  isLocal: boolean;
  sessionReady: boolean;
  offline: boolean;
  error: string | null;
  status: DevNodeStatusResponse | null;
  busy: Action;
  isDefaultSeed: boolean;
  syncWallet: () => void;
  run: (action: Exclude<Action, null>) => void;
  refresh: () => void;
  accountsData: DevNodeAccountsResponse | null;
  accountsBusy: boolean;
  accountsErr: string | null;
  fetchAccounts: () => void;
};

export function DevNodePopoverContent({
  isLocal,
  sessionReady,
  offline,
  error,
  status,
  busy,
  isDefaultSeed,
  syncWallet,
  run,
  refresh,
  accountsData,
  accountsBusy,
  accountsErr,
  fetchAccounts,
}: Props) {
  return (
    <div className="popover" role="dialog" aria-label="Dev node controls">
      {!isLocal && (
        <p className="muted small">
          Switch network to <strong>Local</strong> to use the dev node.
        </p>
      )}
      {isLocal && !sessionReady && (
        <p className="muted small">Select an active wallet before starting the local dev node.</p>
      )}
      {offline && (
        <p className="error small">
          Showcase backend not reachable on <code className="mono">:5174</code>. Start it with{' '}
          <code className="mono">pnpm --filter @cfxdevkit/example-showcase-backend dev</code>.
        </p>
      )}
      {error && !offline && <p className="error small">{error}</p>}

      {/* Mnemonic-sync warning: shown when devnode is running but the keystore */}
      {/* has drifted away from the devnode seed. */}
      {isLocal && status?.running && !isDefaultSeed && (
        <div
          className="warn-box small"
          style={{
            background: 'color-mix(in srgb, #f59e0b 12%, var(--panel))',
            border: '1px solid #f59e0b88',
            borderRadius: 6,
            padding: '8px 10px',
            marginBottom: 6,
          }}
        >
          <strong>⚠ Wallet mismatch</strong>
          <p style={{ margin: '4px 0 6px' }}>
            The active keystore mnemonic differs from the devnode genesis seed. Funded accounts may
            not be reachable.
          </p>
          <button type="button" className="primary small" onClick={syncWallet}>
            Sync wallet to devnode seed
          </button>
        </div>
      )}

      <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
        <button
          type="button"
          className="small"
          disabled={busy !== null}
          onClick={() => void refresh()}
        >
          Refresh
        </button>
        <button
          type="button"
          className="primary small"
          disabled={busy !== null || status?.running === true || !isLocal || !sessionReady}
          onClick={() => run('start')}
        >
          {busy === 'start' ? '…' : 'Start'}
        </button>
        <button
          type="button"
          className="small"
          disabled={busy !== null || !status?.running}
          onClick={() => run('restart')}
        >
          {busy === 'restart' ? '…' : 'Restart'}
        </button>
        <button
          type="button"
          className="small"
          disabled={busy !== null || !status?.running}
          onClick={() => run('stop')}
        >
          {busy === 'stop' ? '…' : 'Stop'}
        </button>
        <button
          type="button"
          className="danger small"
          disabled={busy !== null}
          onClick={() => {
            if (window.confirm('Stop the dev node and delete its data dir?')) void run('wipe');
          }}
        >
          {busy === 'wipe' ? '…' : 'Wipe'}
        </button>
      </div>

      {status?.urls && (
        <dl className="kv small">
          <dt>core</dt>
          <dd className="mono">{status.urls.core}</dd>
          <dt>espace</dt>
          <dd className="mono">{status.urls.espace}</dd>
          {status.config && (
            <>
              <dt>chainId</dt>
              <dd className="mono">
                {status.config.chainId} / {status.config.evmChainId}
              </dd>
              <dt>mining</dt>
              <dd className="mono">
                {status.mining?.enabled ? `every ${status.mining.intervalMs}ms` : 'off'}
                {status.mining?.ticks ? ` · ${status.mining.ticks} ticks` : ''}
              </dd>
            </>
          )}
        </dl>
      )}

      {/* On-demand genesis accounts (no-store) */}
      {status?.running && (
        <div style={{ marginTop: 6 }}>
          {!accountsData && (
            <button
              type="button"
              className="small"
              disabled={accountsBusy}
              onClick={() => void fetchAccounts()}
            >
              {accountsBusy ? 'Loading…' : 'Reveal genesis accounts'}
            </button>
          )}
          {accountsErr && <p className="error small">{accountsErr}</p>}
          {accountsData && (
            <details open>
              <summary className="small">{accountsData.accounts.length} funded accounts</summary>
              <ul className="acct-list">
                {accountsData.accounts.map((a) => (
                  <li key={a.index}>
                    <span className="muted small">
                      [{a.index}] {a.initialBalanceCfx} CFX
                    </span>
                    <button
                      type="button"
                      className="link"
                      onClick={() => void navigator.clipboard.writeText(a.privateKey)}
                      title="Copy private key"
                    >
                      copy pk
                    </button>
                    <code className="mono small">{a.evmAddress}</code>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
