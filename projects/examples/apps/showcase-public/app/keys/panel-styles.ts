/** Shared inline styles for hardware wallet panels. */

export const BUTTON_STYLE: React.CSSProperties = {
  padding: 'var(--cfx-space-2) var(--cfx-space-4)',
  background: 'var(--cfx-color-brand-primary)',
  color: '#fff',
  border: 'none',
  borderRadius: 'var(--cfx-radius-md)',
  cursor: 'pointer',
  fontSize: 'var(--cfx-text-sm)',
};

export const INPUT_STYLE: React.CSSProperties = {
  width: '100%',
  padding: 'var(--cfx-space-2) var(--cfx-space-3)',
  background: 'var(--cfx-color-bg-emphasis)',
  border: '1px solid var(--cfx-color-border-default)',
  borderRadius: 'var(--cfx-radius-md)',
  color: 'var(--cfx-color-fg-default)',
  fontSize: 'var(--cfx-text-sm)',
  boxSizing: 'border-box',
};

export const PANEL_STYLE: React.CSSProperties = {
  display: 'grid',
  gap: 'var(--cfx-space-3)',
  padding: 'var(--cfx-space-4)',
  background: 'var(--cfx-color-bg-subtle)',
  border: '1px solid var(--cfx-color-border-subtle)',
  borderRadius: 'var(--cfx-radius-md)',
};

export const MUTED_STYLE: React.CSSProperties = {
  color: 'var(--cfx-color-fg-muted)',
  fontSize: 'var(--cfx-text-sm)',
  margin: 0,
};

export const labelStyle: React.CSSProperties = {
  display: 'grid',
  gap: 'var(--cfx-space-1)',
  color: 'var(--cfx-color-fg-subtle)',
  fontSize: 'var(--cfx-text-sm)',
};
