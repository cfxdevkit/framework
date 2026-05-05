import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';

export interface ShowcaseSectionLink {
  href: string;
  label: string;
  id: string;
}

export interface PanelGroupLike<TGroup extends string = string> {
  id: TGroup;
  label: string;
}

export interface PanelLike<TGroup extends string = string> {
  id: string;
  group: TGroup;
  label: string;
}

const DEFAULT_LINKS: readonly ShowcaseSectionLink[] = Object.freeze([
  { id: 'showcase', label: 'SDK', href: '/showcase/' },
  { id: 'stack', label: 'Stack', href: '/stack/' },
  { id: 'browser', label: 'Browser', href: '/browser/' },
  { id: 'hardware', label: 'Hardware', href: '/hardware/' },
]);

export function ShowcaseNav(props: {
  current?: string;
  title?: string;
  subtitle?: string;
  gatewayHref?: string;
  links?: readonly ShowcaseSectionLink[];
}) {
  const links = props.links ?? DEFAULT_LINKS;
  return (
    <nav className="showcase-nav" aria-label="Showcase navigation">
      <div className="showcase-nav-title">
        <strong>{props.title ?? 'cfxdevkit showcase'}</strong>
        <span>{props.subtitle ?? 'single gateway workflow'}</span>
      </div>
      <div className="showcase-nav-links">
        <a className="showcase-nav-link gateway" href={props.gatewayHref ?? '/'}>
          Gateway
        </a>
        {links.map((link) => (
          <a
            className={`showcase-nav-link ${props.current === link.id ? 'active' : ''}`}
            href={link.href}
            key={link.id}
          >
            {link.label}
          </a>
        ))}
      </div>
    </nav>
  );
}

export function PanelSidebar<TGroup extends string, TPanel extends PanelLike<TGroup>>(props: {
  groups: readonly PanelGroupLike<TGroup>[];
  panels: readonly TPanel[];
  active: string;
  onSelect(id: string): void;
  renderMeta?(panel: TPanel): ReactNode;
}) {
  const byGroup = useMemo(() => {
    const map = new Map<TGroup, TPanel[]>();
    for (const panel of props.panels) {
      const list = map.get(panel.group) ?? [];
      list.push(panel);
      map.set(panel.group, list);
    }
    return map;
  }, [props.panels]);

  return (
    <aside className="sidebar">
      {props.groups.map((group) => {
        const panels = byGroup.get(group.id) ?? [];
        if (panels.length === 0) return null;
        return (
          <div key={group.id} className="side-group">
            <h3 className="side-group-label">{group.label}</h3>
            <ul className="side-list">
              {panels.map((panel) => (
                <li key={panel.id}>
                  <button
                    type="button"
                    className={`side-item ${props.active === panel.id ? 'active' : ''}`}
                    onClick={() => props.onSelect(panel.id)}
                  >
                    <span>{panel.label}</span>
                    {props.renderMeta?.(panel)}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </aside>
  );
}

export function useActivePanelState(input: {
  panels: readonly { id: string }[];
  storageKey: string;
  fallbackId: string;
  param?: string;
}) {
  const param = input.param ?? 'panel';
  const isKnown = useCallback(
    (id: string) => input.panels.some((panel) => panel.id === id),
    [input.panels],
  );
  const readInitial = useCallback(() => {
    if (typeof window === 'undefined') return input.fallbackId;
    const fromUrl = new URLSearchParams(window.location.search).get(param);
    if (fromUrl && isKnown(fromUrl)) return fromUrl;
    const stored = window.localStorage.getItem(input.storageKey);
    if (stored && isKnown(stored)) return stored;
    return input.fallbackId;
  }, [input.fallbackId, input.storageKey, isKnown, param]);
  const [activeId, setActiveId] = useState<string>(() => readInitial());
  const select = useCallback(
    (id: string) => {
      if (!isKnown(id)) return;
      setActiveId(id);
      if (typeof window === 'undefined') return;
      window.localStorage.setItem(input.storageKey, id);
      const url = new URL(window.location.href);
      url.searchParams.set(param, id);
      window.history.replaceState(null, '', url.toString());
    },
    [input.storageKey, isKnown, param],
  );

  useEffect(() => {
    select(activeId);
  }, [activeId, select]);

  return { activeId, select };
}
