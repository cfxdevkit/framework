'use client';

import { LogBox } from '@cfxdevkit/example-showcase-ui';
import { WORKSPACE_STEPS } from '../workspace/shared';
import {
  resolveWorkspaceSteps,
  ShowcaseWorkspacePanelStage,
  type ShowcaseWorkspaceShellProps,
} from './stage';

export function ShowcaseWorkspaceLoadingShell() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1e1e1e',
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
  const { nextStep, previousStep, stepIndex } = resolveWorkspaceSteps(drafts.activeSection);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#1e1e1e',
        color: '#e7e7e7',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '16px 32px',
          borderBottom: '1px solid #333',
          backgroundColor: '#181818',
        }}
      >
        <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
          cfxdevkit &middot; showcase-local
        </h1>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', gap: '8px' }}>
          {WORKSPACE_STEPS.map((step, index) => (
            <div
              key={step}
              style={{
                padding: '6px 12px',
                borderRadius: '4px',
                fontSize: '13px',
                backgroundColor: index === stepIndex ? '#3b82f6' : '#2d2d2d',
                color: index === stepIndex ? '#fff' : '#a0a0a0',
                fontWeight: index === stepIndex ? 600 : 400,
              }}
            >
              {index + 1}. {step.charAt(0).toUpperCase() + step.slice(1)}
            </div>
          ))}
        </div>
      </header>

      <main
        style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          padding: '48px 24px',
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '800px',
            backgroundColor: '#252526',
            borderRadius: '8px',
            border: '1px solid #333',
            boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ flex: 1, padding: '32px' }}>
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
          </div>

          <footer
            style={{
              padding: '16px 32px',
              borderTop: '1px solid #333',
              display: 'flex',
              justifyContent: 'space-between',
              backgroundColor: '#1e1e1e',
            }}
          >
            <button
              type="button"
              onClick={() => {
                if (previousStep) onSelectSection(previousStep);
              }}
              disabled={!previousStep}
              style={{
                padding: '8px 16px',
                backgroundColor: previousStep ? '#444' : '#333',
                color: previousStep ? '#fff' : '#666',
                border: 'none',
                borderRadius: '4px',
                cursor: previousStep ? 'pointer' : 'not-allowed',
              }}
            >
              &larr; Previous Step
            </button>
            <button
              type="button"
              onClick={() => {
                if (nextStep) onSelectSection(nextStep);
              }}
              disabled={!nextStep}
              style={{
                padding: '8px 24px',
                backgroundColor: nextStep ? '#3b82f6' : '#333',
                color: nextStep ? '#fff' : '#666',
                border: 'none',
                borderRadius: '4px',
                cursor: nextStep ? 'pointer' : 'not-allowed',
                fontWeight: 500,
              }}
            >
              Next Step &rarr;
            </button>
          </footer>
        </div>
      </main>

      <div
        style={{
          height: '250px',
          borderTop: '1px solid #333',
          backgroundColor: '#181818',
          padding: '16px',
          overflowY: 'auto',
        }}
      >
        <h3
          style={{
            margin: '0 0 12px 0',
            fontSize: '12px',
            textTransform: 'uppercase',
            color: '#888',
            letterSpacing: '0.05em',
          }}
        >
          Event Log
        </h3>
        <LogBox entries={entries} empty="No workspace events yet." />
      </div>
    </div>
  );
}
