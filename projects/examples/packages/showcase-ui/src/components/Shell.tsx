import type { ReactNode } from 'react';
import { useState } from 'react';
import './shell.css';

export interface NavItem {
  label: string;
  href: string;
}

export interface ShellProps {
  title?: string;
  nav?: NavItem[];
  sidebar?: ReactNode;
  headerRight?: ReactNode;
  children: ReactNode;
}

export function Shell({
  title = 'Conflux Showcase',
  nav,
  sidebar,
  headerRight,
  children,
}: ShellProps) {
  return (
    <div className="cfx-shell">
      <header className="cfx-shell-header">
        <div className="cfx-shell-header-left">
          <span className="cfx-shell-title">{title}</span>
          {nav && nav.length > 0 && (
            <nav className="cfx-shell-nav">
              {nav.map((item) => (
                <a key={item.href} href={item.href} className="cfx-shell-nav-link">
                  {item.label}
                </a>
              ))}
            </nav>
          )}
        </div>
        {headerRight && <div className="cfx-shell-header-right">{headerRight}</div>}
      </header>
      <div className="cfx-shell-body">
        {sidebar && <aside className="cfx-shell-sidebar">{sidebar}</aside>}
        <main className="cfx-shell-main">{children}</main>
      </div>
    </div>
  );
}

// ── Legacy compat stubs ───────────────────────────────────────────────────────

export interface PanelGroupLike<TGroup extends string = string> {
  id: TGroup;
  label: string;
}

export interface PanelLike<TGroup extends string = string> {
  id: string;
  group: TGroup;
  label: string;
}

/** @deprecated Use Shell with nav prop instead. */
export function ShowcaseNav(_props: {
  current?: string;
  title?: string;
  subtitle?: string;
  gatewayHref?: string;
}) {
  return null;
}

/** @deprecated No longer used. */
export function ShowcaseOpsPanel(_props?: { apiBase?: string }) {
  return null;
}

/** @deprecated No longer used. */
export function SharedDevNodePill(_props?: { apiBase?: string }) {
  return null;
}

/** @deprecated No longer used. */
export function PanelSidebar<TGroup extends string, TPanel extends PanelLike<TGroup>>(props: {
  groups: readonly PanelGroupLike<TGroup>[];
  panels: readonly TPanel[];
  active: string;
  onSelect(id: string): void;
  renderMeta?: (panel: TPanel) => ReactNode;
}) {
  return (
    <aside>
      {props.panels.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => props.onSelect(p.id)}
          style={{ fontWeight: p.id === props.active ? 'bold' : 'normal' }}
        >
          {p.label}
        </button>
      ))}
    </aside>
  );
}

/** @deprecated No longer used. */
export function useActivePanelState(input: {
  panels: readonly { id: string }[];
  storageKey: string;
  fallbackId: string;
  param?: string;
}): { activeId: string; select: (id: string) => void } {
  const [activeId, setActiveId] = useState(() => {
    try {
      return localStorage.getItem(input.storageKey) ?? input.fallbackId;
    } catch {
      return input.fallbackId;
    }
  });
  return {
    activeId,
    select: (id: string) => {
      try {
        localStorage.setItem(input.storageKey, id);
      } catch {
        // ignore
      }
      setActiveId(id);
    },
  };
}
