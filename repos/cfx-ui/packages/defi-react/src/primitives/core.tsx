/**
 * `@cfxdevkit/defi-react/primitives` — core components.
 *
 * @internal Part of the primitives barrel. Import from
 * \`@cfxdevkit/defi-react/primitives\` rather than this file.
 */
import type { ButtonHTMLAttributes, CSSProperties, HTMLAttributes, ReactNode } from 'react';
// ── Button ────────────────────────────────────────────────────────────────

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: ReactNode;
}

const buttonVariantStyles: Record<ButtonVariant, CSSProperties> = {
  primary: {
    background: 'var(--cfx-color-brand-primary)',
    color: 'var(--cfx-color-fg-on-brand)',
    border: '1px solid transparent',
  },
  secondary: {
    background: 'var(--cfx-color-bg-subtle)',
    color: 'var(--cfx-color-fg-default)',
    border: '1px solid var(--cfx-color-border-default)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--cfx-color-fg-default)',
    border: '1px solid transparent',
  },
  danger: {
    background: 'var(--cfx-color-feedback-danger)',
    color: 'var(--cfx-color-fg-on-brand)',
    border: '1px solid transparent',
  },
};

const buttonSizeStyles: Record<ButtonSize, CSSProperties> = {
  sm: { padding: '4px 10px', fontSize: 'var(--cfx-text-sm)' },
  md: { padding: '8px 16px', fontSize: 'var(--cfx-text-base)' },
  lg: { padding: '12px 24px', fontSize: 'var(--cfx-text-lg)' },
};

/**
 * General-purpose button. Supports `primary`, `secondary`, `ghost`, `danger` variants.
 */
export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  style,
  ...rest
}: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        borderRadius: 'var(--cfx-radius-md)',
        fontFamily: 'var(--cfx-font-sans)',
        fontWeight: 600,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled || loading ? 0.5 : 1,
        transition: `opacity 100ms var(--cfx-motion-ease)`,
        ...buttonVariantStyles[variant],
        ...buttonSizeStyles[size],
        ...style,
      }}
      {...rest}
    >
      {loading ? '…' : children}
    </button>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** Extra padding preset. Default: `"md"`. */
  padding?: 'sm' | 'md' | 'lg';
  /** Whether to show a box-shadow. Default: `false`. */
  elevated?: boolean;
}

const cardPadding: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'var(--cfx-space-2)',
  md: 'var(--cfx-space-4)',
  lg: 'var(--cfx-space-6)',
};

/**
 * Content container with a themed background, border, and optional elevation.
 */
export function Card({ padding = 'md', elevated = false, children, style, ...rest }: CardProps) {
  return (
    <div
      style={{
        background: 'var(--cfx-color-bg-subtle)',
        border: '1px solid var(--cfx-color-border-default)',
        borderRadius: 'var(--cfx-radius-lg)',
        padding: cardPadding[padding],
        ...(elevated ? { boxShadow: 'var(--cfx-shadow-md)' } : {}),
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────

export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'brand';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: ReactNode;
}

const badgeVariantStyles: Record<BadgeVariant, CSSProperties> = {
  default: {
    background: 'var(--cfx-color-bg-emphasis)',
    color: 'var(--cfx-color-fg-on-brand)',
  },
  success: {
    background: 'var(--cfx-color-feedback-success)',
    color: '#fff',
  },
  warning: {
    background: 'var(--cfx-color-feedback-warning)',
    color: '#fff',
  },
  danger: {
    background: 'var(--cfx-color-feedback-danger)',
    color: '#fff',
  },
  info: {
    background: 'var(--cfx-color-feedback-info)',
    color: '#fff',
  },
  brand: {
    background: 'var(--cfx-color-brand-primary)',
    color: 'var(--cfx-color-fg-on-brand)',
  },
};

/**
 * Small inline label for status, counts, or categories.
 */
export function Badge({ variant = 'default', children, style, ...rest }: BadgeProps) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 'var(--cfx-radius-pill)',
        fontSize: 'var(--cfx-text-xs)',
        fontFamily: 'var(--cfx-font-sans)',
        fontWeight: 600,
        lineHeight: 1.5,
        ...badgeVariantStyles[variant],
        ...style,
      }}
      {...rest}
    >
      {children}
    </span>
  );
}

// ── Tabs ──────────────────────────────────────────────────────────────────

export interface TabItem<T extends string = string> {
  value: T;
  label: ReactNode;
}

export interface TabsProps<T extends string = string> {
  items: TabItem<T>[];
  active: T;
  onChange: (value: T) => void;
  style?: CSSProperties;
}

/**
 * Simple tab-strip. Manages no internal state — controlled only.
 */
export function Tabs<T extends string = string>({ items, active, onChange, style }: TabsProps<T>) {
  return (
    <div
      role="tablist"
      style={{
        display: 'flex',
        gap: 'var(--cfx-space-1)',
        borderBottom: '1px solid var(--cfx-color-border-default)',
        ...style,
      }}
    >
      {items.map((item) => {
        const isActive = item.value === active;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(item.value)}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: isActive
                ? `2px solid var(--cfx-color-brand-primary)`
                : '2px solid transparent',
              padding: '8px 12px',
              fontFamily: 'var(--cfx-font-sans)',
              fontSize: 'var(--cfx-text-sm)',
              fontWeight: isActive ? 600 : 400,
              color: isActive ? 'var(--cfx-color-brand-primary)' : 'var(--cfx-color-fg-subtle)',
              cursor: 'pointer',
              transition: 'color 150ms',
            }}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

// ── NetworkBadge ──────────────────────────────────────────────────────────

export interface NetworkBadgeProps {
  chainId: number;
  /** Override the display name (auto-detected from chainId otherwise). */
  name?: string;
  style?: CSSProperties;
}

const CHAIN_NAMES: Record<number, string> = {
  1030: 'eSpace',
  71: 'eSpace Testnet',
  1: 'Ethereum',
};

/**
 * Shows a small badge identifying the active network.
 */
export function NetworkBadge({ chainId, name, style }: NetworkBadgeProps) {
  const label = name ?? CHAIN_NAMES[chainId] ?? `Chain ${chainId}`;
  const isTestnet =
    label.toLowerCase().includes('testnet') || label.toLowerCase().includes('local');
  return (
    <Badge variant={isTestnet ? 'warning' : 'brand'} style={style}>
      {label}
    </Badge>
  );
}
