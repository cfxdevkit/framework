export function DevnodeStat({
  label,
  mono = false,
  value,
}: {
  label: string;
  mono?: boolean;
  value: string;
}) {
  return (
    <div style={statCardStyle}>
      <span style={labelStyle}>{label}</span>
      <span style={mono ? monoValueStyle : valueStyle}>{value}</span>
    </div>
  );
}

export const pageGridStyle = {
  display: 'grid',
  gap: 'var(--cfx-space-4)',
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
  padding: 'var(--cfx-space-4)',
};

export const stackStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--cfx-space-3)',
} as const;

export const rowStyle = {
  alignItems: 'center',
  display: 'flex',
  gap: 'var(--cfx-space-3)',
  justifyContent: 'space-between',
} as const;

export const buttonRowStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 'var(--cfx-space-2)',
} as const;

export const statsGridStyle = {
  display: 'grid',
  gap: 'var(--cfx-space-3)',
  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
} as const;

const statCardStyle = {
  border: '1px solid var(--cfx-color-border-default)',
  borderRadius: 'var(--cfx-radius-md)',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--cfx-space-1)',
  padding: 'var(--cfx-space-3)',
} as const;

export const labelStyle = {
  color: 'var(--cfx-color-fg-muted)',
  fontSize: 'var(--cfx-text-xs)',
  textTransform: 'uppercase',
} as const;

const valueStyle = {
  color: 'var(--cfx-color-fg-default)',
  fontSize: 'var(--cfx-text-sm)',
  fontWeight: 600,
} as const;

const monoValueStyle = {
  ...valueStyle,
  fontFamily: 'var(--cfx-font-mono)',
  wordBreak: 'break-all',
} as const;

export const noteStyle = {
  color: 'var(--cfx-color-fg-muted)',
  fontSize: 'var(--cfx-text-sm)',
  lineHeight: 1.5,
} as const;

export const errorStyle = {
  background: 'var(--cfx-color-feedback-danger-subtle)',
  border: '1px solid var(--cfx-color-feedback-danger)',
  borderRadius: 'var(--cfx-radius-md)',
  color: 'var(--cfx-color-feedback-danger)',
  padding: 'var(--cfx-space-3)',
} as const;

export const inputStyle = {
  border: '1px solid var(--cfx-color-border-default)',
  borderRadius: 'var(--cfx-radius-sm)',
  font: 'inherit',
  padding: 'var(--cfx-space-2) var(--cfx-space-3)',
} as const;
