import type { CSSProperties, ReactNode } from 'react';
/**
 * `@cfxdevkit/defi-react/primitives` — feedback components.
 *
 * @internal Part of the primitives barrel. Import from
 * \`@cfxdevkit/defi-react/primitives\` rather than this file.
 */

// ── AppToaster ────────────────────────────────────────────────────────────

export type ToastVariant = 'info' | 'success' | 'warning' | 'error';

export interface Toast {
  id: string;
  message: string;
  variant?: ToastVariant;
  durationMs?: number;
}

export interface AppToasterProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  style?: CSSProperties;
}

const TOAST_COLORS: Record<ToastVariant, { bg: string; color: string }> = {
  info: {
    bg: 'var(--cfx-color-feedback-info-subtle, #e8f4fd)',
    color: 'var(--cfx-color-feedback-info, #0070f3)',
  },
  success: {
    bg: 'var(--cfx-color-feedback-success-subtle, #e6f9ee)',
    color: 'var(--cfx-color-feedback-success, #0a7c42)',
  },
  warning: {
    bg: 'var(--cfx-color-feedback-warning-subtle, #fff8e1)',
    color: 'var(--cfx-color-feedback-warning, #b45309)',
  },
  error: {
    bg: 'var(--cfx-color-feedback-danger-subtle, #fdecea)',
    color: 'var(--cfx-color-feedback-danger, #e53e3e)',
  },
};

const POSITION_STYLES: Record<NonNullable<AppToasterProps['position']>, CSSProperties> = {
  'top-right': { top: 16, right: 16 },
  'top-left': { top: 16, left: 16 },
  'bottom-right': { bottom: 16, right: 16 },
  'bottom-left': { bottom: 16, left: 16 },
};

/**
 * Fixed-position toast container. Manage `toasts` state in the parent with
 * `useState<Toast[]>([])` and wire `onDismiss` to remove by id.
 *
 * @example
 * ```tsx
 * const [toasts, setToasts] = useState<Toast[]>([]);
 * const addToast = (message: string, variant: ToastVariant = 'info') =>
 *   setToasts(prev => [...prev, { id: crypto.randomUUID(), message, variant }]);
 * <AppToaster toasts={toasts} onDismiss={(id) => setToasts(t => t.filter(x => x.id !== id))} />
 * ```
 */
export function AppToaster({ toasts, onDismiss, position = 'top-right', style }: AppToasterProps) {
  return (
    <div
      style={{
        position: 'fixed',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        pointerEvents: 'none',
        ...POSITION_STYLES[position],
        ...style,
      }}
    >
      {toasts.map((toast) => {
        const colors = TOAST_COLORS[toast.variant ?? 'info'];
        return (
          <div
            key={toast.id}
            style={{
              pointerEvents: 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              padding: '10px 14px',
              borderRadius: 8,
              boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
              background: colors.bg,
              color: colors.color,
              fontSize: 'var(--cfx-text-sm)',
              minWidth: 240,
              maxWidth: 400,
            }}
          >
            <span>{toast.message}</span>
            <button
              type="button"
              aria-label="Dismiss"
              onClick={() => onDismiss(toast.id)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'inherit',
                fontSize: '1.1em',
                lineHeight: 1,
                padding: 0,
              }}
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ── SelectableListItem ────────────────────────────────────────────────────

export interface SelectableListItemProps {
  label: string;
  description?: string;
  selected?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  onClick?: () => void;
  style?: CSSProperties;
}

/**
 * List item with optional selection highlight. Useful for wallet pickers,
 * network selectors, and similar lists.
 */
export function SelectableListItem({
  label,
  description,
  selected = false,
  disabled = false,
  icon,
  onClick,
  style,
}: SelectableListItemProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 14px',
        borderRadius: 8,
        border: selected
          ? '1px solid var(--cfx-color-brand-primary, #3b82f6)'
          : '1px solid transparent',
        background: selected
          ? 'var(--cfx-color-brand-primary-subtle, rgba(59,130,246,0.12))'
          : 'transparent',
        color: disabled
          ? 'var(--cfx-color-fg-disabled, #5c6c7c)'
          : 'var(--cfx-color-fg-default, #eef3fb)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        textAlign: 'left',
        transition: 'background 0.12s, border-color 0.12s',
        ...style,
      }}
    >
      {icon && <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>{icon}</span>}
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontWeight: 500 }}>{label}</span>
        {description && (
          <span
            style={{
              display: 'block',
              fontSize: 'var(--cfx-text-xs, 11px)',
              color: 'var(--cfx-color-fg-muted)',
              marginTop: 2,
            }}
          >
            {description}
          </span>
        )}
      </span>
      {selected && (
        <span
          role="img"
          aria-label="Selected"
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: 'var(--cfx-color-brand-primary, #3b82f6)',
            flexShrink: 0,
          }}
        />
      )}
    </button>
  );
}
