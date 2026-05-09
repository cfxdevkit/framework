/**
 * `@cfxdevkit/defi-react/primitives` — layout components.
 *
 * @internal Part of the primitives barrel. Import from
 * \`@cfxdevkit/defi-react/primitives\` rather than this file.
 */

import type { CSSProperties, ReactNode } from 'react';
import { Card } from './core.js';
// ── SectionHeader ─────────────────────────────────────────────────────────

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  style?: CSSProperties;
}

/**
 * Section title with optional subtitle and right-aligned action slot.
 */
export function SectionHeader({ title, subtitle, action, style }: SectionHeaderProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        ...style,
      }}
    >
      <div>
        <div
          style={{
            fontSize: 'var(--cfx-text-lg)',
            fontWeight: 600,
            color: 'var(--cfx-color-fg-default)',
          }}
        >
          {title}
        </div>
        {subtitle && (
          <div
            style={{
              fontSize: 'var(--cfx-text-sm)',
              color: 'var(--cfx-color-fg-muted)',
              marginTop: 2,
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// ── StatusBanner ──────────────────────────────────────────────────────────

export type StatusBannerVariant = 'info' | 'success' | 'warning' | 'error';

export interface StatusBannerProps {
  variant?: StatusBannerVariant;
  children: ReactNode;
  style?: CSSProperties;
}

const BANNER_STYLES: Record<StatusBannerVariant, CSSProperties> = {
  info: {
    background: 'var(--cfx-color-feedback-info-subtle, #e8f4fd)',
    color: 'var(--cfx-color-feedback-info, #0070f3)',
  },
  success: {
    background: 'var(--cfx-color-feedback-success-subtle, #e6f9ee)',
    color: 'var(--cfx-color-feedback-success, #0a7c42)',
  },
  warning: {
    background: 'var(--cfx-color-feedback-warning-subtle, #fff8e1)',
    color: 'var(--cfx-color-feedback-warning, #b45309)',
  },
  error: {
    background: 'var(--cfx-color-feedback-danger-subtle, #fdecea)',
    color: 'var(--cfx-color-feedback-danger, #e53e3e)',
  },
};

/**
 * Full-width alert strip in info, success, warning, or error styles.
 */
export function StatusBanner({ variant = 'info', children, style }: StatusBannerProps) {
  return (
    <div
      role="alert"
      style={{
        padding: '10px 16px',
        borderRadius: '6px',
        fontSize: 'var(--cfx-text-sm)',
        ...BANNER_STYLES[variant],
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ── MetricCard ────────────────────────────────────────────────────────────

export interface MetricCardProps {
  label: string;
  value: ReactNode;
  /** Optional delta percentage string, e.g. "+2.4%" */
  delta?: string;
  style?: CSSProperties;
}

/**
 * KPI card displaying a labelled metric value with optional delta indicator.
 */
export function MetricCard({ label, value, delta, style }: MetricCardProps) {
  const isPositive = delta ? delta.startsWith('+') : false;
  const isNegative = delta ? delta.startsWith('-') : false;
  return (
    <Card style={{ minWidth: 120, ...style }}>
      <div
        style={{
          fontSize: 'var(--cfx-text-xs, 11px)',
          color: 'var(--cfx-color-fg-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 'var(--cfx-text-xl, 24px)',
          fontWeight: 700,
          color: 'var(--cfx-color-fg-default)',
          margin: '4px 0',
        }}
      >
        {value}
      </div>
      {delta && (
        <div
          style={{
            fontSize: 'var(--cfx-text-sm)',
            color: isPositive
              ? 'var(--cfx-color-feedback-success, #0a7c42)'
              : isNegative
                ? 'var(--cfx-color-feedback-danger, #e53e3e)'
                : 'var(--cfx-color-fg-muted)',
          }}
        >
          {delta}
        </div>
      )}
    </Card>
  );
}
