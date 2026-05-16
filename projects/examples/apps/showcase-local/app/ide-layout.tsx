'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';

const layoutStyle = {
  display: 'flex',
  height: '100vh',
  width: '100vw',
  overflow: 'hidden',
  backgroundColor: '#1e1e1e', // VSCode editor dark
  color: '#cccccc',
  fontFamily: 'var(--cfx-font-sans)',
} as const;

const activityBarStyle = {
  width: '48px',
  flexShrink: 0,
  backgroundColor: '#333333', // VSCode activity bar
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  paddingTop: '12px',
  gap: '16px',
} as const;

const sidebarStyle = {
  width: '280px',
  flexShrink: 0,
  backgroundColor: '#252526', // VSCode sidebar
  borderRight: '1px solid #3c3c3c',
  display: 'flex',
  flexDirection: 'column',
} as const;

const mainAreaStyle = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0,
} as const;

const editorAreaStyle = {
  flex: 1,
  overflowY: 'auto',
  backgroundColor: '#1e1e1e',
  position: 'relative',
} as const;

const panelStyle = {
  height: '280px',
  flexShrink: 0,
  borderTop: '1px solid #3c3c3c',
  backgroundColor: '#1e1e1e', // panel color
  display: 'flex',
  flexDirection: 'column',
} as const;

const panelHeaderStyle = {
  height: '35px',
  display: 'flex',
  alignItems: 'center',
  padding: '0 16px',
  borderBottom: '1px solid #3c3c3c',
  fontSize: '11px',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: '#e7e7e7',
} as const;

export function IdeLayout({
  sidebar,
  children,
  bottomPanel,
}: {
  sidebar: ReactNode;
  children: ReactNode;
  bottomPanel: ReactNode;
}) {
  const [panelOpen, setPanelOpen] = useState(true);

  return (
    <div style={layoutStyle}>
      <div style={activityBarStyle}>
        <div
          style={{ width: 24, height: 24, color: '#ffffff', opacity: 1, cursor: 'pointer' }}
          title="Explorer"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <path d="M3 3h18v18H3zM3 9h18M9 21V9" />
          </svg>
        </div>
        <div
          style={{ width: 24, height: 24, color: '#ffffff', opacity: 0.5, cursor: 'pointer' }}
          title="Search"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        <div
          style={{
            width: 24,
            height: 24,
            color: '#ffffff',
            opacity: 0.5,
            cursor: 'pointer',
            marginTop: 'auto',
            marginBottom: 12,
          }}
          title="Settings"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </div>
      </div>
      <div style={sidebarStyle}>
        <div
          style={{
            padding: '12px 16px',
            fontSize: '11px',
            textTransform: 'uppercase',
            color: '#cccccc',
            letterSpacing: '0.05em',
          }}
        >
          Explorer
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>{sidebar}</div>
      </div>
      <div style={mainAreaStyle}>
        <div style={editorAreaStyle}>{children}</div>
        {panelOpen && (
          <div style={panelStyle}>
            <div style={panelHeaderStyle}>
              <div
                style={{
                  borderBottom: '1px solid #e7e7e7',
                  paddingBottom: 2,
                  marginRight: 24,
                  cursor: 'pointer',
                }}
              >
                TERMINAL
              </div>
              <div style={{ opacity: 0.5, cursor: 'pointer', marginRight: 24 }}>OUTPUT</div>
              <div style={{ opacity: 0.5, cursor: 'pointer' }}>DEBUG CONSOLE</div>
              <div style={{ flex: 1 }} />
              <button
                type="button"
                aria-label="Close Panel"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'inherit',
                  cursor: 'pointer',
                  opacity: 0.8,
                  padding: 0,
                }}
                onClick={() => setPanelOpen(false)}
                title="Close Panel"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M14 7v2H2V7h12z" />
                </svg>
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#1e1e1e' }}>
              {bottomPanel}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
