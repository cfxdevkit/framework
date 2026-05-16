import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import './shell.css';
import './sidebar.css';

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
  const groupedPanels = useMemo(() => {
    const map = new Map<TGroup, TPanel[]>();
    for (const panel of props.panels) {
      const current = map.get(panel.group) ?? [];
      current.push(panel);
      map.set(panel.group, current);
    }
    return map;
  }, [props.panels]);

  return (
    <aside className="cfx-sidebar" aria-label="Showcase panels">
      {props.groups.map((group) => {
        const panels = groupedPanels.get(group.id) ?? [];
        if (panels.length === 0) {
          return null;
        }

        return (
          <div key={group.id} className="cfx-sidebar-group">
            <div className="cfx-sidebar-group-label">{group.label}</div>
            {panels.map((panel) => (
              <button
                key={panel.id}
                type="button"
                className={`cfx-sidebar-item${props.active === panel.id ? ' active' : ''}`}
                onClick={() => props.onSelect(panel.id)}
                aria-current={props.active === panel.id ? 'page' : undefined}
                style={{
                  alignItems: 'center',
                  display: 'flex',
                  gap: 'var(--cfx-space-2)',
                  justifyContent: 'space-between',
                }}
              >
                <span>{panel.label}</span>
                {props.renderMeta?.(panel)}
              </button>
            ))}
          </div>
        );
      })}
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
