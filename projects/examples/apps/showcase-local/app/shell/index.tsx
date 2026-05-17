'use client';

import { LogBox } from '@cfxdevkit/example-showcase-ui';
import type { WorkspaceSectionId } from '../workspace/shared';
import { ShowcaseWorkspacePanelStage, type ShowcaseWorkspaceShellProps } from './stage';

// Sections accessible regardless of keystore phase
const GATE_EXEMPT: readonly WorkspaceSectionId[] = ['keystore', 'setup'];

interface NavItem {
  id: WorkspaceSectionId;
  label: string;
  localOnly?: boolean;
}

interface NavGroup {
  label: string;
  items: readonly NavItem[];
}

const NAV: readonly NavGroup[] = [
  {
    label: 'Wallets',
    items: [
      { id: 'keystore', label: 'Keystore & Wallets' },
      { id: 'accounts', label: 'Accounts' },
    ],
  },
  {
    label: 'Backend',
    items: [
      { id: 'devnode', label: 'Local Node', localOnly: true },
      { id: 'setup', label: 'Environment' },
    ],
  },
  {
    label: 'Build',
    items: [
      { id: 'compiler', label: 'Compiler' },
      { id: 'deploy', label: 'Deploy' },
      { id: 'contract-context', label: 'Contracts' },
    ],
  },
  {
    label: 'Auth',
    items: [
      { id: 'session-key', label: 'Session Key' },
      { id: 'custom-operation', label: 'Custom Op' },
    ],
  },
];

export function ShowcaseWorkspaceLoadingShell() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#141414',
        color: '#e7e7e7',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div style={{ padding: '32px', textAlign: 'center' }}>
        <h2 style={{ margin: '0 0 16px 0', fontWeight: 500 }}>Restoring workspace...</h2>
        <p style={{ color: '#888', margin: 0 }}>
          Loading the saved network, signer, and panel state.
        </p>
      </div>
    </div>
  );
}

export function ShowcaseWorkspaceShell({
  activePanel,
  clearLog,
  compose,
  drafts,
  entries,
  keystore,
  keystoreActions,
  onOpenDialog,
  onSelectSection,
}: ShowcaseWorkspaceShellProps) {
  const keystorePhase = keystore.keystorePhase;
  const isGated = keystorePhase !== null && keystorePhase !== 'active-wallet';

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#1a1a1a',
        color: '#e7e7e7',
        fontFamily: 'system-ui, sans-serif',
        overflow: 'hidden',
      }}
    >
      {/* ── Header ── */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px',
          height: '44px',
          borderBottom: '1px solid #2a2a2a',
          backgroundColor: '#111',
          flexShrink: 0,
          gap: '12px',
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: '14px',
            fontWeight: 600,
            letterSpacing: '-0.01em',
            color: '#d0d0d0',
          }}
        >
          cfxdevkit &middot; showcase-local
        </h1>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {keystore.keystoreBadge}
        </div>
      </header>

      {/* ── Body: sidebar + main ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Sidebar nav */}
        <nav
          style={{
            width: '188px',
            flexShrink: 0,
            borderRight: '1px solid #252525',
            backgroundColor: '#141414',
            overflowY: 'auto',
            padding: '8px 0',
          }}
        >
          {NAV.map((group) => (
            <div key={group.label} style={{ marginBottom: '4px' }}>
              <div
                style={{
                  padding: '8px 14px 4px',
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#484848',
                  userSelect: 'none',
                }}
              >
                {group.label}
              </div>
              {group.items.map((item) => {
                if (item.localOnly && drafts.network !== 'local') return null;
                const isActive = drafts.activeSection === item.id;
                const isLocked = isGated && !GATE_EXEMPT.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={isLocked}
                    onClick={() => onSelectSection(item.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      width: '100%',
                      padding: '7px 14px',
                      fontSize: '13px',
                      textAlign: 'left',
                      border: 'none',
                      borderLeft: isActive ? '2px solid #3b82f6' : '2px solid transparent',
                      background: isActive ? 'rgba(59,130,246,0.12)' : 'transparent',
                      color: isActive ? '#93c5fd' : isLocked ? '#333' : '#a0a0a0',
                      cursor: isLocked ? 'default' : 'pointer',
                      fontWeight: isActive ? 600 : 400,
                    }}
                  >
                    {isLocked ? <span style={{ fontSize: '10px', opacity: 0.5 }}>⊘</span> : null}
                    {item.label}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Main content */}
        <main
          style={{
            flex: 1,
            overflowY: 'auto',
            backgroundColor: '#1a1a1a',
          }}
        >
          <ShowcaseWorkspacePanelStage
            activePanel={activePanel}
            clearLog={clearLog}
            compose={compose}
            drafts={drafts}
            entries={entries}
            keystore={keystore}
            keystoreActions={keystoreActions}
            onOpenDialog={onOpenDialog}
            onSelectSection={onSelectSection}
          />
        </main>
      </div>

      {/* ── Event log footer ── */}
      <div
        style={{
          height: '220px',
          borderTop: '1px solid #252525',
          backgroundColor: '#111',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '6px 14px',
            borderBottom: '1px solid #1e1e1e',
          }}
        >
          <span
            style={{
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#484848',
            }}
          >
            Event Log
          </span>
          <button
            type="button"
            disabled={entries.length === 0}
            onClick={clearLog}
            style={{
              padding: '3px 8px',
              fontSize: '11px',
              background: 'transparent',
              color: entries.length === 0 ? '#333' : '#888',
              border: '1px solid',
              borderColor: entries.length === 0 ? '#2a2a2a' : '#404040',
              borderRadius: '3px',
              cursor: entries.length === 0 ? 'default' : 'pointer',
            }}
          >
            Clear
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 14px' }}>
          <LogBox entries={entries} empty="No workspace events yet." />
        </div>
      </div>
    </div>
  );
}
