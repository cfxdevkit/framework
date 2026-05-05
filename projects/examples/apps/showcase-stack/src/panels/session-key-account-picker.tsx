import type { DevNodeAccountResponse } from '../lib/api.js';

type Props = {
  accounts: DevNodeAccountResponse[] | null;
  accountsLoading: boolean;
  accountsErr: string | null;
  parentPrivateKey: string;
  setParentPrivateKey: (v: string) => void;
  onLoad: () => void;
};

export function SessionKeyAccountPicker({
  accounts,
  accountsLoading,
  accountsErr,
  parentPrivateKey,
  setParentPrivateKey,
  onLoad,
}: Props) {
  return (
    <div className="panel" style={{ marginBottom: 16 }}>
      <div className="row" style={{ marginBottom: accounts ? 10 : 0 }}>
        <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600, flex: 1 }}>Parent account</h3>
        <button
          type="button"
          className="small secondary"
          disabled={accountsLoading}
          onClick={onLoad}
        >
          {accountsLoading ? 'Loading…' : accounts ? 'Refresh accounts' : 'Load devnode accounts'}
        </button>
      </div>
      {accountsErr && (
        <p style={{ color: 'var(--err)', fontSize: 12, margin: '8px 0 0' }}>{accountsErr}</p>
      )}
      {accounts && accounts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
          {accounts.map((a) => {
            const isSelected = parentPrivateKey === a.privateKey;
            return (
              <button
                key={a.index}
                type="button"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '6px 8px',
                  borderRadius: 6,
                  border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                  background: isSelected
                    ? 'color-mix(in srgb, var(--accent) 8%, var(--panel))'
                    : 'var(--panel-2)',
                  cursor: 'pointer',
                  fontSize: 12,
                  width: '100%',
                  textAlign: 'left',
                }}
                onClick={() => setParentPrivateKey(a.privateKey)}
              >
                <span
                  style={{
                    fontFamily: 'var(--mono)',
                    color: 'var(--muted)',
                    minWidth: 20,
                    textAlign: 'right',
                  }}
                >
                  [{a.index}]
                </span>
                <span
                  style={{
                    fontFamily: 'var(--mono)',
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {a.evmAddress}
                </span>
                <span style={{ color: 'var(--muted)' }}>{a.initialBalanceCfx} CFX</span>
                {isSelected && <span style={{ color: 'var(--accent)', fontWeight: 600 }}>✓</span>}
              </button>
            );
          })}
        </div>
      )}
      {!accounts && !accountsLoading && (
        <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>
          Click "Load devnode accounts" to pick a funded genesis account, or enter a private key
          manually below.
        </p>
      )}
    </div>
  );
}
