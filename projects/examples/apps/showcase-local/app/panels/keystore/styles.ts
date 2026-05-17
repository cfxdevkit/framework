export const cardStyle = {
  border: '1px solid var(--cfx-color-border-default)',
  borderRadius: 'var(--cfx-radius-md)',
  padding: '20px',
  display: 'grid',
  gap: '14px',
} as const;

export const sectionLabelStyle = {
  fontSize: 'var(--cfx-text-xs)',
  fontWeight: 700 as const,
  letterSpacing: '0.08em',
  textTransform: 'uppercase' as const,
  color: 'var(--cfx-color-fg-muted)',
} as const;

export const addressRowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--cfx-space-2)',
  flexWrap: 'wrap' as const,
} as const;
