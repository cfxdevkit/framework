/**
 * `@cfxdevkit/defi-react/primitives` — app shell and panel layout components.
 *
 * @internal Part of the primitives barrel. Import from
 * `@cfxdevkit/defi-react/primitives` rather than this file.
 */

import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';

// ── AppShell ──────────────────────────────────────────────────────────────

/**
 * Full-page app shell wrapper. Provides a flex column layout that fills the
 * viewport height, placing the nav bar at the top and content below.
 */
export function AppShell({
  children,
  style,
  ...props
}: { children: ReactNode; style?: CSSProperties } & HTMLAttributes<HTMLElement>) {
  return (
    <main
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100dvh',
        background: 'var(--cfx-color-bg-canvas, #f5f5f5)',
        ...style,
      }}
      {...props}
    >
      {children}
    </main>
  );
}

// ── MainGrid ──────────────────────────────────────────────────────────────

export interface MainGridProps {
  sidebar?: ReactNode;
  children: ReactNode;
  style?: CSSProperties;
}

/**
 * Two-column page layout with an optional sidebar.
 */
export function MainGrid({ sidebar, children, style }: MainGridProps) {
  return (
    <section
      style={{
        display: 'grid',
        gridTemplateColumns: sidebar ? '260px 1fr' : '1fr',
        gap: 'var(--cfx-space-4, 16px)',
        padding: 'var(--cfx-space-5, 20px)',
        flex: 1,
        alignItems: 'start',
        ...style,
      }}
    >
      {sidebar ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{sidebar}</div>
      ) : null}
      {children}
    </section>
  );
}

// ── Panel ─────────────────────────────────────────────────────────────────

export interface PanelProps {
  title?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  style?: CSSProperties;
}

/**
 * Content panel with an optional header row (title + actions).
 */
export function Panel({ title, icon, actions, children, style }: PanelProps) {
  const hasHeader = title || icon || actions;
  return (
    <section
      style={{
        background: 'var(--cfx-color-bg-surface, #fff)',
        border: '1px solid var(--cfx-color-border, rgba(0,0,0,0.1))',
        borderRadius: 'var(--cfx-radius-md, 8px)',
        overflow: 'hidden',
        ...style,
      }}
    >
      {hasHeader ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 16px',
            borderBottom: '1px solid var(--cfx-color-border, rgba(0,0,0,0.08))',
          }}
        >
          {icon ? <span style={{ color: 'var(--cfx-color-accent, #2563eb)' }}>{icon}</span> : null}
          {title ? (
            <h2
              style={{
                margin: 0,
                fontSize: 'var(--cfx-text-sm, 14px)',
                fontWeight: 600,
                flex: 1,
                color: 'var(--cfx-color-fg, #111)',
              }}
            >
              {title}
            </h2>
          ) : null}
          {actions ? <div style={{ marginLeft: 'auto' }}>{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

// ── PanelBody ─────────────────────────────────────────────────────────────

/**
 * Padded body area inside a Panel.
 */
export function PanelBody({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <div style={{ padding: '16px', ...style }}>{children}</div>;
}
