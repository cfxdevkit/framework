/**
 * Showcase shell.
 *
 *   ┌────────────────────────────────────────────────────────────────────┐
 *   │  Title · NetworkSelector · SpaceToggle · DevNodePill              │
 *   ├──────────────┬─────────────────────────────────────────────────────┤
 *   │              │                                                     │
 *   │  Sidebar     │                <active panel>                       │
 *   │  (groups)    │                                                     │
 *   │              │                                                     │
 *   └──────────────┴─────────────────────────────────────────────────────┘
 *
 * Panels are registered in `panels/registry.ts` and lazy-loaded so the
 * initial bundle only ships the shell + the chosen panel. Active panel
 * id is persisted to `?panel=` so deep links survive reload.
 */
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { DevNodePill } from './components/DevNodePill.js';
import { NetworkSelector } from './components/NetworkSelector.js';
import { SpaceToggle } from './components/SpaceToggle.js';
import { WalletPill } from './components/WalletPill.js';
import { CompilerSessionProvider } from './contexts/CompilerSession.js';
import { NetworkProvider } from './contexts/NetworkProvider.js';
import { WalletProvider } from './contexts/WalletProvider.js';
import { GROUPS, getPanel, PANELS, type PanelSpec, panelsByGroup } from './panels/registry.js';

const PARAM = 'panel';
// `PANELS` is built from a frozen literal in `panels/registry.ts` and is
// always non-empty — the cast keeps `noUncheckedIndexedAccess` quiet.
const DEFAULT_PANEL = PANELS[0] as PanelSpec;

function readActivePanel(): string {
  if (typeof window === 'undefined') return DEFAULT_PANEL.id;
  const url = new URLSearchParams(window.location.search).get(PARAM);
  if (url && getPanel(url)) return url;
  const stored = window.localStorage.getItem('showcase.panel');
  if (stored && getPanel(stored)) return stored;
  return DEFAULT_PANEL.id;
}

function writeActivePanel(id: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem('showcase.panel', id);
  const url = new URL(window.location.href);
  url.searchParams.set(PARAM, id);
  window.history.replaceState(null, '', url.toString());
}

function Sidebar({ active, onSelect }: { active: string; onSelect: (id: string) => void }) {
  return (
    <aside className="sidebar">
      {GROUPS.map((g) => {
        const panels = panelsByGroup(g.id);
        if (panels.length === 0) return null;
        return (
          <div key={g.id} className="side-group">
            <h3 className="side-group-label">{g.label}</h3>
            <ul className="side-list">
              {panels.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    className={`side-item ${active === p.id ? 'active' : ''}`}
                    onClick={() => onSelect(p.id)}
                  >
                    <span>{p.label}</span>
                    {p.spaces.length > 0 && (
                      <span className="space-badges" aria-hidden>
                        {p.spaces.map((s) => (
                          <span key={s} className={`space-badge space-${s}`}>
                            {s === 'core' ? 'C' : 'E'}
                          </span>
                        ))}
                      </span>
                    )}
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

function Shell() {
  const [activeId, setActiveId] = useState<string>(() => readActivePanel());
  const active = useMemo(() => getPanel(activeId) ?? DEFAULT_PANEL, [activeId]);

  const select = useCallback((id: string) => {
    setActiveId(id);
    writeActivePanel(id);
  }, []);

  // Keep ?panel= synced once on mount when the initial value came from
  // localStorage rather than the URL.
  useEffect(() => {
    writeActivePanel(activeId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  const Active = active.component;

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <h1>cfxdevkit · showcase</h1>
          <span className="sub">@cfxdevkit/* live demo + integration harness</span>
        </div>
        <div className="env-bar">
          <NetworkSelector />
          <SpaceToggle />
          <DevNodePill />
          <WalletPill />
        </div>
      </header>

      <div className="layout">
        <Sidebar active={activeId} onSelect={select} />
        <main className="content">
          <div className="panel-head">
            <h2>{active.label}</h2>
            <p className="panel-blurb">{active.blurb}</p>
          </div>
          <Suspense fallback={<p className="muted">loading {active.label}…</p>}>
            <Active />
          </Suspense>
        </main>
      </div>
    </div>
  );
}

export function App() {
  return (
    <NetworkProvider>
      <WalletProvider>
        <CompilerSessionProvider>
          <Shell />
        </CompilerSessionProvider>
      </WalletProvider>
    </NetworkProvider>
  );
}
