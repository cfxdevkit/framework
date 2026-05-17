'use client';

import { CopyButton } from '@cfxdevkit/example-showcase-ui';
import { DEPLOY_SNIPPET } from '../../lib/showcase-guide';
import {
  buttonRowStyle,
  DevnodeStat,
  errorStyle,
  noteStyle,
  rowStyle,
  stackStyle,
  statsGridStyle,
} from '../devnode/devnode-ui';
import {
  CollapsibleCodeExample,
  displayNetwork,
  formatDeployedAt,
  formatSpace,
  preStyle,
  type ShowcaseWorkspacePanelsProps,
  sectionStyle,
} from './shared';

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

          {/* Contract registry */}
          <div>
            <div
              style={{
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#666',
                marginBottom: '10px',
              }}
            >
              Deployed contracts ({props.contracts.length})
            </div>
            {props.contracts.length > 0 ? (
              <div style={stackStyle}>
                {props.contracts.map((contract) => (
                  <div
                    key={contract.id}
                    style={{
                      border:
                        props.selectedContractId === contract.id
                          ? '1px solid #3b82f6'
                          : '1px solid var(--cfx-color-border-default)',
                      borderRadius: 'var(--cfx-radius-md)',
                      display: 'grid',
                      gap: 'var(--cfx-space-2)',
                      padding: 'var(--cfx-space-3)',
                      backgroundColor:
                        props.selectedContractId === contract.id
                          ? 'rgba(59,130,246,0.04)'
                          : 'transparent',
                    }}
                  >
                    <div style={rowStyle}>
                      <strong>{contract.name}</strong>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: '#2a2a2a',
                            color: '#999',
                          }}
                        >
                          {contract.network}
                        </span>
                        <span
                          style={{
                            fontSize: '11px',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: '#2a2a2a',
                            color: '#999',
                          }}
                        >
                          {contract.space === 'espace' ? 'eSpace' : 'Core'}
                        </span>
                      </div>
                    </div>
                    <div style={noteStyle}>
                      <code style={{ fontSize: '11px' }}>{contract.address}</code>
                    </div>
                    <div style={noteStyle}>Deployed: {formatDeployedAt(contract.deployedAt)}</div>
                    <div style={buttonRowStyle}>
                      <CopyButton label="copy address" text={contract.address} />
                      <button
                        type="button"
                        disabled={props.selectedContractId === contract.id}
                        onClick={() => props.onSelectContract(contract.id)}
                      >
                        {props.selectedContractId === contract.id ? 'Selected' : 'Select'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={noteStyle}>No contracts deployed yet.</div>
            )}
          </div>

          <CollapsibleCodeExample code={DEPLOY_SNIPPET} label="Deploy backend flow" />
        </div>
      </div>
    </section>
  );
}
