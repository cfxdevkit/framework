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
import { PanelSidebar, ShowcaseNav, useActivePanelState } from '@cfxdevkit/example-showcase-ui';
import { Suspense, useMemo } from 'react';
import { DevNodePill } from './components/DevNodePill.js';
import { NetworkSelector } from './components/NetworkSelector.js';
import { SpaceToggle } from './components/SpaceToggle.js';
import { WalletPill } from './components/WalletPill.js';
import { CompilerSessionProvider } from './contexts/CompilerSession.js';
import { KeystoreSessionProvider } from './contexts/KeystoreSessionProvider.js';
import { NetworkProvider } from './contexts/NetworkProvider.js';
import { WalletProvider } from './contexts/WalletProvider.js';
import { GROUPS, getPanel, PANELS, type PanelSpec } from './panels/registry.js';

// `PANELS` is built from a frozen literal in `panels/registry.ts` and is
// always non-empty — the cast keeps `noUncheckedIndexedAccess` quiet.
const DEFAULT_PANEL = PANELS[0] as PanelSpec;

function Shell() {
  const { activeId, select } = useActivePanelState({
    panels: PANELS,
    storageKey: 'showcase.panel',
    fallbackId: DEFAULT_PANEL.id,
  });
  const active = useMemo(() => getPanel(activeId) ?? DEFAULT_PANEL, [activeId]);

  const Active = active.component;

  return (
    <div className="app">
      <ShowcaseNav current="showcase" />
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
        <PanelSidebar
          groups={GROUPS}
          panels={PANELS}
          active={activeId}
          onSelect={select}
          renderMeta={(panel) =>
            panel.spaces.length > 0 ? (
              <span className="space-badges" aria-hidden>
                {panel.spaces.map((space) => (
                  <span key={space} className={`space-badge space-${space}`}>
                    {space === 'core' ? 'C' : 'E'}
                  </span>
                ))}
              </span>
            ) : null
          }
        />
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
      <KeystoreSessionProvider>
        <WalletProvider>
          <CompilerSessionProvider>
            <Shell />
          </CompilerSessionProvider>
        </WalletProvider>
      </KeystoreSessionProvider>
    </NetworkProvider>
  );
}
