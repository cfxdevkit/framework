/**
 * `@cfxdevkit/defi-react/primitives` — app navigation bar.
 *
 * @internal Part of the primitives barrel. Import from
 * `@cfxdevkit/defi-react/primitives` rather than this file.
 */

import type { CSSProperties, ReactNode } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────

export interface NavLink {
  href: string;
  label: string;
  icon?: ReactNode;
  active?: boolean;
}

export interface AppNavBarProps {
  /** Brand/logo slot — rendered as a link or static node. */
  brand: ReactNode;
  /** Navigation links. Mark one `active` to highlight it. */
  links: NavLink[];
  /** Slot rendered on the right side (wallet connect button, etc.). */
  actions?: ReactNode;
  /** Called when a nav link is clicked. Useful for SPA routers. */
  onLinkClick?: (href: string) => void;
  /** Override container styles. */
  style?: CSSProperties;
}

// ── Styles ────────────────────────────────────────────────────────────────

const NAV_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--cfx-space-4, 16px)',
  padding: '0 var(--cfx-space-5, 20px)',
  height: 56,
  borderBottom: '1px solid var(--cfx-color-border, rgba(0,0,0,0.1))',
  background: 'var(--cfx-color-bg-surface, #fff)',
  position: 'sticky',
  top: 0,
  zIndex: 100,
};

const BRAND_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  textDecoration: 'none',
  color: 'var(--cfx-color-fg, #111)',
  fontWeight: 600,
  fontSize: 'var(--cfx-text-sm, 14px)',
  flexShrink: 0,
};

const LINKS_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  flex: 1,
};

const ACTIONS_STYLE: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  marginLeft: 'auto',
  flexShrink: 0,
};

const getLinkStyle = (active: boolean): CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '6px 10px',
  borderRadius: 'var(--cfx-radius-sm, 4px)',
  fontSize: 'var(--cfx-text-sm, 14px)',
  fontWeight: active ? 600 : 400,
  textDecoration: 'none',
  color: active ? 'var(--cfx-color-accent, #2563eb)' : 'var(--cfx-color-fg-muted, #555)',
  background: active ? 'var(--cfx-color-accent-subtle, rgba(37,99,235,0.08))' : 'transparent',
  transition: 'background 0.15s, color 0.15s',
});

// ── Component ─────────────────────────────────────────────────────────────

/**
 * Generic app navigation bar. Accepts brand, links, and an actions slot.
 *
 * This component is intentionally router-agnostic — pass plain `<a>` tags or
 * framework-specific `Link` components via the `links[].href` prop and handle
 * navigation with the `onLinkClick` callback.
 *
 * @example
 * ```tsx
 * <AppNavBar
 *   brand={<><Zap size={16} /> My App</>}
 *   links={[
 *     { href: '/dashboard', label: 'Dashboard', active: pathname === '/dashboard' },
 *     { href: '/settings', label: 'Settings', active: pathname === '/settings' },
 *   ]}
 *   actions={<ConnectButton />}
 * />
 * ```
 */
export function AppNavBar({ brand, links, actions, onLinkClick, style }: AppNavBarProps) {
  return (
    <header style={{ ...NAV_STYLE, ...style }}>
      <span style={BRAND_STYLE}>{brand}</span>

      <nav style={LINKS_STYLE} aria-label="Application navigation">
        {links.map((link) => (
          <a
            key={link.href}
            href={link.href}
            style={getLinkStyle(link.active ?? false)}
            aria-current={link.active ? 'page' : undefined}
            onClick={
              onLinkClick
                ? (e) => {
                    e.preventDefault();
                    onLinkClick(link.href);
                  }
                : undefined
            }
          >
            {link.icon}
            {link.label}
          </a>
        ))}
      </nav>

      {actions ? <div style={ACTIONS_STYLE}>{actions}</div> : null}
    </header>
  );
}

// ── NavBrand helper ───────────────────────────────────────────────────────

export interface NavBrandProps {
  /** Icon or logo element. */
  icon?: ReactNode;
  /** App name text. */
  name: string;
  style?: CSSProperties;
}

/**
 * Pre-styled brand/logo for use inside `AppNavBar`.
 *
 * @example
 * ```tsx
 * <AppNavBar brand={<NavBrand icon={<Zap size={16} />} name="My App" />} ... />
 * ```
 */
export function NavBrand({ icon, name, style }: NavBrandProps) {
  const MARK_STYLE: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
    borderRadius: 'var(--cfx-radius-sm, 4px)',
    background: 'var(--cfx-color-accent, #2563eb)',
    color: '#fff',
    flexShrink: 0,
  };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, ...style }}>
      {icon ? <span style={MARK_STYLE}>{icon}</span> : null}
      <span>{name}</span>
    </span>
  );
}
