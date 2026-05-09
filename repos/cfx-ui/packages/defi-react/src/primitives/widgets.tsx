/**
 * `@cfxdevkit/defi-react/primitives` — inline widget components.
 *
 * @internal Part of the primitives barrel. Import from
 * `@cfxdevkit/defi-react/primitives` rather than this file.
 */

import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react';

// ── Field ─────────────────────────────────────────────────────────────────

/**
 * Labelled form field wrapper. Renders a `<label>` that encloses its children.
 */
export function Field({
  label,
  children,
  style,
}: {
  label: string;
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: Field wraps form controls passed as children.
    <label
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        fontSize: 'var(--cfx-text-sm, 13px)',
        color: 'var(--cfx-color-fg-muted, #555)',
        ...style,
      }}
    >
      <span style={{ fontWeight: 500 }}>{label}</span>
      {children}
    </label>
  );
}

// ── Notice ────────────────────────────────────────────────────────────────

export type NoticeTone = 'neutral' | 'ok' | 'error' | 'warning';

const NOTICE_TONE_STYLES: Record<NoticeTone, CSSProperties> = {
  neutral: {
    background: 'var(--cfx-color-bg-subtle, #f8f8f8)',
    color: 'var(--cfx-color-fg-muted, #555)',
    border: '1px solid var(--cfx-color-border, rgba(0,0,0,0.1))',
  },
  ok: {
    background: 'var(--cfx-color-feedback-success-subtle, #f0fdf4)',
    color: 'var(--cfx-color-feedback-success, #16a34a)',
    border: '1px solid var(--cfx-color-feedback-success, #16a34a)',
  },
  error: {
    background: 'var(--cfx-color-feedback-danger-subtle, #fef2f2)',
    color: 'var(--cfx-color-feedback-danger, #dc2626)',
    border: '1px solid var(--cfx-color-feedback-danger, #dc2626)',
  },
  warning: {
    background: 'var(--cfx-color-feedback-warning-subtle, #fffbeb)',
    color: 'var(--cfx-color-feedback-warning, #d97706)',
    border: '1px solid var(--cfx-color-feedback-warning, #d97706)',
  },
};

export interface NoticeProps {
  tone?: NoticeTone;
  children: ReactNode;
  style?: CSSProperties;
}

/**
 * Inline notice/alert banner with tone variants: neutral, ok, error, warning.
 */
export function Notice({ tone = 'neutral', children, style }: NoticeProps) {
  return (
    <div
      style={{
        padding: '8px 12px',
        borderRadius: 'var(--cfx-radius-sm, 4px)',
        fontSize: 'var(--cfx-text-sm, 13px)',
        ...NOTICE_TONE_STYLES[tone],
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ── IconButton ────────────────────────────────────────────────────────────

export type IconButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'className' | 'type' | 'aria-label'
> & {
  title: string;
  style?: CSSProperties;
};

/**
 * Square icon-only button. Requires a `title` prop for accessibility.
 */
export function IconButton({ title, children, style, ...props }: IconButtonProps) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 32,
        height: 32,
        borderRadius: 'var(--cfx-radius-sm, 4px)',
        border: '1px solid var(--cfx-color-border, rgba(0,0,0,0.15))',
        background: 'transparent',
        cursor: 'pointer',
        color: 'var(--cfx-color-fg-muted, #555)',
        padding: 0,
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  );
}

// ── StatusGrid ────────────────────────────────────────────────────────────

/**
 * Responsive grid of metric/status cells. Commonly used on status/health pages.
 */
export function StatusGrid({
  children,
  columns = 3,
  style,
}: {
  children: ReactNode;
  columns?: number;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: 'var(--cfx-space-3, 12px)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ── Metric ────────────────────────────────────────────────────────────────

/**
 * Single labelled metric cell for use inside StatusGrid.
 */
export function Metric({
  label,
  value,
  style,
}: {
  label: string;
  value: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        padding: '12px 16px',
        background: 'var(--cfx-color-bg-surface, #fff)',
        border: '1px solid var(--cfx-color-border, rgba(0,0,0,0.1))',
        borderRadius: 'var(--cfx-radius-sm, 4px)',
        ...style,
      }}
    >
      <span
        style={{
          fontSize: 'var(--cfx-text-xs, 11px)',
          color: 'var(--cfx-color-fg-muted, #888)',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          fontWeight: 500,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 'var(--cfx-text-md, 16px)',
          fontWeight: 600,
          color: 'var(--cfx-color-fg, #111)',
        }}
      >
        {value}
      </span>
    </div>
  );
}
