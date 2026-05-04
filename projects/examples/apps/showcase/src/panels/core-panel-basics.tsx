type Json = unknown;

export function pretty(value: Json): string {
  return JSON.stringify(
    value,
    (_key, item) => (typeof item === 'bigint' ? `${item.toString()}n` : item),
    2,
  );
}

export interface AddressCodecSectionProps {
  chainId: number;
  hexIn: string;
  base32In: string;
  codecOut: string | null;
  codecErr: string | null;
  setHexIn: (value: string) => void;
  setBase32In: (value: string) => void;
  runHexToBase32: () => void;
  runBase32ToHex: () => void;
  runCanonicalise: () => void;
}

export function AddressCodecSection({
  chainId,
  hexIn,
  base32In,
  codecOut,
  codecErr,
  setHexIn,
  setBase32In,
  runHexToBase32,
  runBase32ToHex,
  runCanonicalise,
}: AddressCodecSectionProps) {
  return (
    <div className="card" style={{ marginTop: 16 }}>
      <h3 style={{ marginTop: 0 }}>Address codec</h3>
      <p className="muted" style={{ fontSize: 12 }}>
        Convert between hex (<code>0x…</code>) and base32 (<code>cfx:…</code> /{' '}
        <code>cfxtest:…</code>). Network ID is taken from the active chain (<code>{chainId}</code>).
      </p>
      <div className="row" style={{ gap: 8 }}>
        <label style={{ flex: 1 }}>
          <span>hex</span>
          <input
            value={hexIn}
            onChange={(e) => setHexIn(e.target.value.trim())}
            spellCheck={false}
          />
        </label>
        <label style={{ flex: 1 }}>
          <span>base32</span>
          <input
            value={base32In}
            onChange={(e) => setBase32In(e.target.value.trim())}
            spellCheck={false}
          />
        </label>
      </div>
      <div className="row" style={{ gap: 8, marginTop: 8 }}>
        <button type="button" onClick={runHexToBase32}>
          hexToBase32 →
        </button>
        <button type="button" onClick={runBase32ToHex}>
          ← base32ToHex
        </button>
        <button type="button" onClick={runCanonicalise}>
          getCoreAddress (validate)
        </button>
      </div>
      {codecOut && <pre className="result">{codecOut}</pre>}
      {codecErr && <p className="error">{codecErr}</p>}
    </div>
  );
}

export interface UnitsSectionProps {
  cfxAmt: string;
  setCfxAmt: (value: string) => void;
  unitsRow: { drip: string; cfx: string; gdrip: string } | null;
}

export function UnitsSection({ cfxAmt, setCfxAmt, unitsRow }: UnitsSectionProps) {
  return (
    <div className="card" style={{ marginTop: 16 }}>
      <h3 style={{ marginTop: 0 }}>Units</h3>
      <label>
        <span>CFX amount</span>
        <input value={cfxAmt} onChange={(e) => setCfxAmt(e.target.value)} />
      </label>
      {unitsRow ? (
        <dl className="kv">
          <dt>parseCFX</dt>
          <dd>{unitsRow.drip} drip</dd>
          <dt>formatCFX</dt>
          <dd>{unitsRow.cfx}</dd>
          <dt>formatGDrip</dt>
          <dd>{unitsRow.gdrip}</dd>
        </dl>
      ) : (
        <p className="error">parse failed</p>
      )}
    </div>
  );
}

export function StatusSection({
  status,
  statusErr,
  statusBusy,
  refreshStatus,
}: {
  status: unknown;
  statusErr: string | null;
  statusBusy: boolean;
  refreshStatus: () => void;
}) {
  return (
    <div className="card" style={{ marginTop: 16 }}>
      <h3 style={{ marginTop: 0 }}>Status & epoch</h3>
      <button type="button" className="primary" onClick={refreshStatus} disabled={statusBusy}>
        {statusBusy ? 'Querying…' : 'getStatus + getEpochNumber'}
      </button>
      {statusErr && <p className="error">{statusErr}</p>}
      {status !== null && <pre className="result">{pretty(status)}</pre>}
    </div>
  );
}

export function AccountSection({
  active,
  acct,
  acctErr,
  acctBusy,
  refreshAccount,
}: {
  active: boolean;
  acct: unknown;
  acctErr: string | null;
  acctBusy: boolean;
  refreshAccount: () => void;
}) {
  return (
    <div className="card" style={{ marginTop: 16 }}>
      <h3 style={{ marginTop: 0 }}>Account & mapped balance</h3>
      {!active && (
        <p className="muted">Connect a wallet on the Wallet tab to enable this section.</p>
      )}
      {active && (
        <>
          <button type="button" className="primary" onClick={refreshAccount} disabled={acctBusy}>
            {acctBusy ? 'Querying…' : 'getBalance + bridge.getMappedBalance + mappedEspaceAddress'}
          </button>
          {acctErr && <p className="error">{acctErr}</p>}
          {acct !== null && <pre className="result">{pretty(acct)}</pre>}
        </>
      )}
    </div>
  );
}
