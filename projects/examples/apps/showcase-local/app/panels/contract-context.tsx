'use client';

import { CopyButton, StatusBadge } from '@cfxdevkit/example-showcase-ui';
import {
  buttonRowStyle,
  DevnodeStat,
  noteStyle,
  rowStyle,
  stackStyle,
  statsGridStyle,
} from '../devnode/devnode-ui';
import {
  disclosureStyle,
  disclosureSummaryStyle,
  displayNetwork,
  formatDeployedAt,
  preStyle,
  type ShowcaseWorkspacePanelsProps,
  sectionStyle,
} from './shared';

export function ContractContextPanel(props: ShowcaseWorkspacePanelsProps) {
  return (
    <section
      id="contract-context"
      style={props.activeSection === 'contract-context' ? sectionStyle : { display: 'none' }}
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
            Contract Context
          </h2>
          <p style={{ margin: 0, color: '#888', fontSize: '13px', lineHeight: 1.5 }}>
            Use this pane as a compact registry summary. The heavy actions stay in dedicated sheets
            so the selected contract remains readable.
          </p>
        </div>
        <div style={stackStyle}>
          {props.selectedContract ? (
            <>
              <div style={statsGridStyle}>
                <DevnodeStat
                  label="Network"
                  value={displayNetwork(props.selectedContract.network)}
                />
                <DevnodeStat label="Chain id" value={String(props.selectedContract.chainId)} />
                <DevnodeStat
                  label="Space"
                  value={props.selectedContract.space === 'espace' ? 'eSpace' : 'Core'}
                />
                <DevnodeStat label="ABI items" value={String(props.selectedContract.abi.length)} />
              </div>
              <div
                style={{
                  border: '1px solid var(--cfx-color-border-default)',
                  borderRadius: 'var(--cfx-radius-md)',
                  display: 'grid',
                  gap: 'var(--cfx-space-2)',
                  padding: 'var(--cfx-space-3)',
                }}
              >
                <div style={rowStyle}>
                  <strong>{props.selectedContract.name}</strong>
                  <StatusBadge label="selected" status="ok" />
                </div>
                <div style={noteStyle}>
                  Address: <code>{props.selectedContract.address}</code>
                </div>
                <div style={noteStyle}>
                  Registered: {formatDeployedAt(props.selectedContract.deployedAt)}
                </div>
                <div style={buttonRowStyle}>
                  <CopyButton label="copy address" text={props.selectedContract.address} />
                  <button type="button" onClick={props.onLoadSelectedContractIntoSession}>
                    Scope session key to this contract
                  </button>
                  <button type="button" onClick={() => props.onOpenDialog('deploy')}>
                    Open deploy sheet
                  </button>
                </div>
              </div>
              {props.selectedContractFunctions.length > 0 ? (
                <details style={disclosureStyle}>
                  <summary style={disclosureSummaryStyle}>
                    ABI functions ({props.selectedContractFunctions.length})
                  </summary>
                  <pre style={preStyle}>{props.selectedContractFunctions.join('\n')}</pre>
                </details>
              ) : (
                <div style={noteStyle}>
                  This registry entry does not expose callable ABI functions yet.
                </div>
              )}
            </>
          ) : (
            <div style={noteStyle}>
              No contract is registered for {displayNetwork(props.network)} yet. Open a family node
              under Contracts in the rail to load or deploy into that registry.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
