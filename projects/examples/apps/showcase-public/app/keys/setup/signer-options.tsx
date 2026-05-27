export type SignerKind = 'memory' | 'ledger' | 'onekey';
export interface DemoSigner {
  kind: SignerKind;
  label: string;
}

export const STORAGE_KEY = 'cfxdevkit.demoSigner';

export const OPTIONS: { kind: SignerKind; title: string; subtitle: string; features: string[] }[] =
  [
    {
      kind: 'memory',
      title: '⚡ Quick memory wallet',
      subtitle: 'Instant setup — no hardware needed',
      features: [
        'Fresh key generated each page load',
        'eSpace + Core Space',
        'EIP-712 + CIP-23',
        '⚠ Ephemeral — never use for real funds',
      ],
    },
    {
      kind: 'ledger',
      title: '🔐 Ledger',
      subtitle: 'WebHID — Nano S/X/Plus',
      features: [
        'eSpace + Core Space',
        'signMessage on both spaces',
        'EIP-712 / CIP-23: ❌ not supported',
        'Requires Chrome/Edge + WebHID',
      ],
    },
    {
      kind: 'onekey',
      title: '🔑 OneKey Classic S1',
      subtitle: 'WebUSB — EAL 6+',
      features: [
        'eSpace + Core Space',
        'signMessage on both spaces',
        'EIP-712 ✅ exclusive',
        'CIP-23 ✅ exclusive',
        'Requires Chrome/Edge + WebUSB',
      ],
    },
  ];

export const PANEL_STYLE: React.CSSProperties = {
  padding: 'var(--cfx-space-4)',
  background: 'var(--cfx-color-bg-subtle)',
  border: '1px solid var(--cfx-color-border-subtle)',
  borderRadius: 'var(--cfx-radius-md)',
  cursor: 'pointer',
  transition: 'border-color 0.15s',
};

export const PANEL_ACTIVE_STYLE: React.CSSProperties = {
  ...PANEL_STYLE,
  borderColor: 'var(--cfx-color-brand-primary)',
  background: 'color-mix(in srgb, var(--cfx-color-brand-primary) 5%, var(--cfx-color-bg-subtle))',
};

export function SignerOptionCard({
  opt,
  active,
  onSelect,
}: {
  opt: (typeof OPTIONS)[0];
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      style={{ ...(active ? PANEL_ACTIVE_STYLE : PANEL_STYLE), textAlign: 'left', width: '100%' }}
    >
      <p style={{ fontWeight: 700, margin: '0 0 4px', fontSize: 'var(--cfx-text-base)' }}>
        {opt.title}
      </p>
      <p
        style={{
          color: 'var(--cfx-color-fg-muted)',
          fontSize: 'var(--cfx-text-sm)',
          margin: '0 0 8px',
        }}
      >
        {opt.subtitle}
      </p>
      <ul style={{ margin: 0, padding: '0 0 0 16px', display: 'grid', gap: 2 }}>
        {opt.features.map((f) => (
          <li
            key={f}
            style={{ fontSize: 'var(--cfx-text-xs)', color: 'var(--cfx-color-fg-subtle)' }}
          >
            {f}
          </li>
        ))}
      </ul>
    </button>
  );
}
