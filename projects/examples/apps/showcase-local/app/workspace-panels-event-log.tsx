'use client';

import { buttonRowStyle, stackStyle } from './devnode/devnode-ui';
import type { ShowcaseWorkspacePanelsProps } from './workspace-panels-shared';

const stickyLogWrapStyle = {
  bottom: 0,
  paddingBottom: 'var(--cfx-space-4)',
  position: 'sticky',
  zIndex: 10,
} as const;

export function EventLogPanel(props: ShowcaseWorkspacePanelsProps) {
  return (
    <section id="event-log" style={stickyLogWrapStyle}>
      <div style={{ padding: '24px', backgroundColor: '#1e1e1e' }}>
        <div
          style={{ paddingBottom: '16px', borderBottom: '1px solid #3c3c3c', marginBottom: '24px' }}
        >
          <h2
            style={{
              fontSize: '20px',
              margin: 0,
              fontWeight: 500,
              color: '#e7e7e7',
              marginBottom: '8px',
            }}
          >
            Event Log
          </h2>
          <p style={{ margin: 0, color: '#888', fontSize: '13px', lineHeight: 1.5 }}>
            This log is shared across setup, keystore, local node, session-key, compile, and deploy
            actions so the whole workflow stays visible in one place.
          </p>
        </div>
        <div style={stackStyle}>
          <div style={buttonRowStyle}>
            <button type="button" disabled={props.entries.length === 0} onClick={props.clearLog}>
              Clear log
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
