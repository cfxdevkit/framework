'use client';

import { CUSTOM_OPERATION_SNIPPET } from '../lib/showcase-guide';
import {
  buttonRowStyle,
  DevnodeStat,
  errorStyle,
  noteStyle,
  stackStyle,
  statsGridStyle,
} from './devnode/devnode-ui';
import {
  CollapsibleCodeExample,
  displayNetwork,
  formatSpace,
  preStyle,
  type ShowcaseWorkspacePanelsProps,
  sectionStyle,
} from './workspace-panels-shared';

export function CustomOperationPanel(props: ShowcaseWorkspacePanelsProps) {
  return (
    <section
      id="custom-operation"
      style={props.activeSection === 'custom-operation' ? sectionStyle : { display: 'none' }}
    >
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
            Custom Backend Action
          </h2>
          <p style={{ margin: 0, color: '#888', fontSize: '13px', lineHeight: 1.5 }}>
            This pane stays as a result view. Open the action sheet only when you need to choose the
            family and execute the custom backend call.
          </p>
        </div>
        <div style={stackStyle}>
          <div style={statsGridStyle}>
            <DevnodeStat label="Network" value={displayNetwork(props.network)} />
            <DevnodeStat label="Target family" value={formatSpace(props.space)} />
            <DevnodeStat
              label="Latest head"
              value={props.customBlockResult?.head ?? 'not loaded'}
            />
            <DevnodeStat
              label="RPC"
              mono
              value={props.customBlockResult?.rpcUrl ?? 'resolve from selected environment'}
            />
          </div>
          {props.customBlockError ? <div style={errorStyle}>{props.customBlockError}</div> : null}
          <div style={buttonRowStyle}>
            <button type="button" onClick={() => props.onOpenDialog('custom-operation')}>
              Open block reader
            </button>
          </div>
          <div style={noteStyle}>
            Programmatic consumers can call the same thin adapter route with the active environment
            in the query string.
          </div>
          {props.customBlockResult ? (
            <pre style={preStyle}>{JSON.stringify(props.customBlockResult, null, 2)}</pre>
          ) : null}
          <CollapsibleCodeExample
            code={CUSTOM_OPERATION_SNIPPET}
            label="Custom backend route example"
          />
        </div>
      </div>
    </section>
  );
}
