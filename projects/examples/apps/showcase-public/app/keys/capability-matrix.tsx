'use client';

const ROWS: { feature: string; memory: string; ledger: string; onekey: string }[] = [
  { feature: 'eSpace address', memory: '✅', ledger: '✅', onekey: '✅' },
  { feature: 'Core Space address', memory: '✅', ledger: '✅', onekey: '✅' },
  { feature: 'signMessage (eSpace)', memory: '✅', ledger: '✅', onekey: '✅' },
  { feature: 'signMessage (Core)', memory: '✅', ledger: '✅ fw 2.3+', onekey: '✅' },
  { feature: 'signTypedData EIP-712', memory: '✅', ledger: '❌', onekey: '✅ exclusive' },
  { feature: 'signTypedData CIP-23', memory: '✅', ledger: '❌', onekey: '✅ exclusive' },
  { feature: 'Transport', memory: 'in-browser', ledger: 'WebHID', onekey: 'WebUSB' },
  { feature: 'Device discovery', memory: '—', ledger: 'manual', onekey: 'searchDevices()' },
];

const TH: React.CSSProperties = {
  padding: 'var(--cfx-space-2) var(--cfx-space-3)',
  textAlign: 'left',
  fontSize: 'var(--cfx-text-sm)',
  fontWeight: 600,
  borderBottom: '2px solid var(--cfx-color-border-default)',
  color: 'var(--cfx-color-fg-default)',
  whiteSpace: 'nowrap',
};
const TD: React.CSSProperties = {
  padding: 'var(--cfx-space-2) var(--cfx-space-3)',
  fontSize: 'var(--cfx-text-sm)',
  borderBottom: '1px solid var(--cfx-color-border-subtle)',
  verticalAlign: 'middle',
};
const TD_FEATURE: React.CSSProperties = {
  ...TD,
  color: 'var(--cfx-color-fg-subtle)',
  fontWeight: 500,
};
const TD_ONEKEY: React.CSSProperties = {
  ...TD,
  background: 'color-mix(in srgb, var(--cfx-color-brand-primary) 5%, transparent)',
};
const TH_ONEKEY: React.CSSProperties = {
  ...TH,
  background: 'color-mix(in srgb, var(--cfx-color-brand-primary) 8%, transparent)',
  borderRadius: 'var(--cfx-radius-sm) var(--cfx-radius-sm) 0 0',
};

export function CapabilityMatrix() {
  return (
    <div style={{ overflowX: 'auto', marginBottom: 'var(--cfx-space-2)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'auto' }}>
        <thead>
          <tr>
            <th style={TH}>Feature</th>
            <th style={TH}>Memory wallet</th>
            <th style={TH}>Ledger</th>
            <th style={{ ...TH_ONEKEY }}>OneKey Classic S1 ★</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row) => (
            <tr key={row.feature}>
              <td style={TD_FEATURE}>{row.feature}</td>
              <td style={TD}>{row.memory}</td>
              <td style={TD}>{row.ledger}</td>
              <td style={TD_ONEKEY}>{row.onekey}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p
        style={{
          fontSize: 'var(--cfx-text-xs)',
          color: 'var(--cfx-color-fg-muted)',
          marginTop: 'var(--cfx-space-2)',
          margin: 0,
        }}
      >
        ★ OneKey is the only hardware wallet with EIP-712 and CIP-23 typed-data signing support on
        Conflux.
      </p>
    </div>
  );
}
