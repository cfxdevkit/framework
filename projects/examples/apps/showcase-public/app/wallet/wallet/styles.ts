export const ROW: React.CSSProperties = {
  borderBottom: '1px solid var(--cfx-color-border-subtle)',
};

export const TD_LABEL: React.CSSProperties = {
  padding: 'var(--cfx-space-2) var(--cfx-space-3)',
  color: 'var(--cfx-color-fg-subtle)',
  width: 150,
};

export const TD_VALUE: React.CSSProperties = {
  padding: 'var(--cfx-space-2) var(--cfx-space-3)',
  fontFamily: 'monospace',
  wordBreak: 'break-all',
};

export const FORM_GRID: React.CSSProperties = {
  display: 'grid',
  gap: 'var(--cfx-space-3)',
};

export const TWO_COL_GRID: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  gap: 'var(--cfx-space-3)',
};

export const INPUT_STYLE: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: 'var(--cfx-space-2) var(--cfx-space-3)',
  background: 'var(--cfx-color-bg-emphasis)',
  border: '1px solid var(--cfx-color-border-default)',
  borderRadius: 'var(--cfx-radius-md)',
  color: 'var(--cfx-color-fg-default)',
  fontFamily: 'monospace',
  fontSize: 'var(--cfx-text-sm)',
};

export const LABEL_STYLE: React.CSSProperties = {
  display: 'grid',
  gap: 'var(--cfx-space-1)',
  color: 'var(--cfx-color-fg-subtle)',
  fontSize: 'var(--cfx-text-sm)',
};

export const MUTED_TEXT: React.CSSProperties = {
  color: 'var(--cfx-color-fg-muted)',
  fontSize: 'var(--cfx-text-sm)',
  margin: 0,
};

export function chainBtn(active: boolean, disabled: boolean): React.CSSProperties {
  return {
    padding: 'var(--cfx-space-2) var(--cfx-space-4)',
    background: active ? 'var(--cfx-color-brand-primary)' : 'var(--cfx-color-bg-emphasis)',
    color: active ? '#fff' : 'var(--cfx-color-fg-default)',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'var(--cfx-color-border-default)',
    borderRadius: 'var(--cfx-radius-md)',
    cursor: disabled ? 'default' : 'pointer',
    fontSize: 'var(--cfx-text-sm)',
  };
}

export function actionBtn(disabled: boolean): React.CSSProperties {
  return {
    padding: 'var(--cfx-space-2) var(--cfx-space-4)',
    background: disabled ? 'var(--cfx-color-bg-emphasis)' : 'var(--cfx-color-brand-primary)',
    color: disabled ? 'var(--cfx-color-fg-muted)' : '#fff',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: disabled ? 'var(--cfx-color-border-default)' : 'transparent',
    borderRadius: 'var(--cfx-radius-md)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: 'var(--cfx-text-sm)',
    width: 'fit-content',
  };
}
