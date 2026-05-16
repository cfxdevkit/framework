'use client';

import { DEPLOY_SNIPPET } from '../lib/showcase-guide';
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

export function DeployPanel(props: ShowcaseWorkspacePanelsProps) {
  return (
    <section
      id="deploy"
      style={props.activeSection === 'deploy' ? sectionStyle : { display: 'none' }}
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
            Deploy
          </h2>
          <p style={{ margin: 0, color: '#888', fontSize: '13px', lineHeight: 1.5 }}>
            Keep deployment setup compact in the pane and open the deploy sheet only when you are
            ready to broadcast the active artifact.
          </p>
        </div>
        <div style={stackStyle}>
          <div style={statsGridStyle}>
            <DevnodeStat label="Network" value={displayNetwork(props.network)} />
            <DevnodeStat label="Target family" value={formatSpace(props.space)} />
            <DevnodeStat label="Active signer" value={props.activeWallet?.name ?? 'not ready'} />
            <DevnodeStat label="Artifact" value={props.artifact?.contractName ?? 'not compiled'} />
          </div>
          <div style={noteStyle}>
            Faucet/help:{' '}
            <a href={props.selectedFaucet.href} rel="noreferrer" target="_blank">
              {props.selectedFaucet.label}
            </a>
          </div>
          {props.localWriteBlocked ? (
            <div style={errorStyle}>Local deployments require the local devnode to be running.</div>
          ) : null}
          {props.deployError ? <div style={errorStyle}>{props.deployError}</div> : null}
          <div style={buttonRowStyle}>
            <button
              type="button"
              disabled={!props.artifact || !props.readyForWrite}
              onClick={() => props.onOpenDialog('deploy')}
            >
              Open deploy sheet
            </button>
            <button type="button" disabled={props.contractsBusy} onClick={props.onRefreshContracts}>
              {props.contractsBusy ? 'Syncing contracts…' : 'Refresh contract registry'}
            </button>
          </div>
          {props.deployResult ? (
            <pre style={preStyle}>{JSON.stringify(props.deployResult, null, 2)}</pre>
          ) : null}
          <CollapsibleCodeExample code={DEPLOY_SNIPPET} label="Deploy backend flow" />
        </div>
      </div>
    </section>
  );
}
