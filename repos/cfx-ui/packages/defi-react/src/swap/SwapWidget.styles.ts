export const cardStyle = {
  background: 'var(--cfx-color-bg-subtle)',
  border: '1px solid var(--cfx-color-border-default)',
  borderRadius: 'var(--cfx-radius-lg)',
  padding: 'var(--cfx-space-4)',
  display: 'grid',
  gap: 'var(--cfx-space-3)',
  fontFamily: 'var(--cfx-font-sans)',
  color: 'var(--cfx-color-fg-default)',
} as const;

export const inputRowStyle = {
  display: 'flex',
  gap: 'var(--cfx-space-2)',
  alignItems: 'center',
} as const;

export const amountInputStyle = {
  flex: 1,
  background: 'var(--cfx-color-bg-default)',
  border: '1px solid var(--cfx-color-border-subtle)',
  borderRadius: 'var(--cfx-radius-md)',
  padding: '8px 12px',
  fontFamily: 'var(--cfx-font-mono)',
  fontSize: 'var(--cfx-text-base)',
  color: 'var(--cfx-color-fg-default)',
  outline: 'none',
} as const;

const selectStyle = {
  background: 'var(--cfx-color-bg-default)',
  border: '1px solid var(--cfx-color-border-subtle)',
  borderRadius: 'var(--cfx-radius-md)',
  padding: '8px 12px',
  fontSize: 'var(--cfx-text-sm)',
  color: 'var(--cfx-color-fg-default)',
  cursor: 'pointer',
} as const;

export const tokenButtonStyle = {
  ...selectStyle,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 'var(--cfx-space-2)',
  minWidth: 160,
  textAlign: 'left' as const,
} as const;

export const invertButtonStyle = {
  alignSelf: 'center',
  background: 'var(--cfx-color-bg-default)',
  border: '1px solid var(--cfx-color-border-subtle)',
  borderRadius: '999px',
  color: 'var(--cfx-color-fg-default)',
  cursor: 'pointer',
  fontSize: 'var(--cfx-text-base)',
  padding: '8px 12px',
} as const;

export const pickerOverlayStyle = {
  position: 'fixed' as const,
  inset: 0,
  background: 'rgba(2, 6, 23, 0.78)',
  display: 'grid',
  placeItems: 'center',
  padding: 'var(--cfx-space-4)',
  zIndex: 60,
} as const;

export const pickerCardStyle = {
  width: 'min(100%, 420px)',
  maxHeight: 'min(80vh, 640px)',
  overflow: 'hidden',
  display: 'grid',
  gap: 'var(--cfx-space-3)',
  background: 'var(--cfx-color-bg-subtle)',
  border: '1px solid var(--cfx-color-border-default)',
  borderRadius: 'var(--cfx-radius-lg)',
  padding: 'var(--cfx-space-4)',
  boxShadow: '0 24px 64px rgba(2, 6, 23, 0.36)',
} as const;

export const pickerHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 'var(--cfx-space-2)',
} as const;

export const pickerTitleStyle = {
  fontSize: 'var(--cfx-text-base)',
  fontWeight: 600,
} as const;

export const closeButtonStyle = {
  background: 'transparent',
  border: 'none',
  color: 'var(--cfx-color-fg-muted)',
  cursor: 'pointer',
  fontSize: 'var(--cfx-text-base)',
  padding: 0,
} as const;

export const swapButtonStyle = {
  background: 'var(--cfx-color-brand-primary)',
  color: 'var(--cfx-color-fg-on-brand)',
  border: 'none',
  borderRadius: 'var(--cfx-radius-md)',
  padding: '10px 16px',
  fontFamily: 'var(--cfx-font-sans)',
  fontSize: 'var(--cfx-text-base)',
  fontWeight: 600,
  cursor: 'pointer',
  width: '100%',
} as const;

export const mutedTextStyle = {
  fontSize: 'var(--cfx-text-sm)',
  color: 'var(--cfx-color-fg-muted)',
} as const;

export const errorTextStyle = {
  fontSize: 'var(--cfx-text-sm)',
  color: 'var(--cfx-color-feedback-danger)',
} as const;
