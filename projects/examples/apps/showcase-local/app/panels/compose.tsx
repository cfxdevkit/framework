'use client';

import { COMPILER_SNIPPET, SESSION_KEY_SNIPPET } from '../../lib/showcase-guide';
import {
  buttonRowStyle,
  DevnodeStat,
  errorStyle,
  noteStyle,
  pageGridStyle,
  stackStyle,
  statsGridStyle,
} from '../devnode/devnode-ui';
import {
  CollapsibleCodeExample,
  chainIdFor,
  formatSpace,
  isAddressLike,
  isSelectorLike,
  normalizedTtl,
  preStyle,
  type ShowcaseWorkspacePanelsProps,
  sectionStyle,
  splitValues,
} from './shared';

export function ComposePanels(props: ShowcaseWorkspacePanelsProps) {
  const selectedContractCount = splitValues(props.sessionContracts, isAddressLike).length;
  const sessionTtl = normalizedTtl(props.sessionTtlMinutes);

  return (
    <div style={pageGridStyle}>
      <section
        id="session-key"
        style={props.activeSection === 'session-key' ? sectionStyle : { display: 'none' }}
      >
        <div style={{ padding: '24px', backgroundColor: '#1e1e1e' }}>
          <div
            style={{
              paddingBottom: '16px',
              borderBottom: '1px solid #3c3c3c',
              marginBottom: '24px',
            }}
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
              Session Key
            </h2>
            <p style={{ margin: 0, color: '#888', fontSize: '13px', lineHeight: 1.5 }}>
              Keep the main pane focused on scope status. Open the composer only when you need to
              mint or adjust a delegated signer capability.
            </p>
          </div>
          <div style={stackStyle}>
            <div style={statsGridStyle}>
              <DevnodeStat
                label="Scoped chain"
                value={String(chainIdFor(props.network, props.space))}
              />
              <DevnodeStat label="Target family" value={formatSpace(props.space)} />
              <DevnodeStat
                label="Parent signer"
                value={props.activeWallet ? props.activeWallet.name : 'not ready'}
              />
              <DevnodeStat label="Contracts in scope" value={String(selectedContractCount)} />
            </div>

            {props.sessionError ? <div style={errorStyle}>{props.sessionError}</div> : null}

            <div style={buttonRowStyle}>
              <button
                type="button"
                disabled={!props.readyForWrite}
                onClick={() => props.onOpenDialog('session-key')}
              >
                Open session composer
              </button>
              <button
                type="button"
                disabled={props.sessionBusy !== 'idle' || !props.issuedSession}
                onClick={props.onVerifySession}
              >
                {props.sessionBusy === 'verifying' ? 'Verifying…' : 'Verify attestation'}
              </button>
            </div>

            <div style={noteStyle}>
              Selector list: {splitValues(props.sessionSelectors, isSelectorLike).length} entries.
              TTL: {sessionTtl} minutes.
            </div>

            {props.issuedSession ? (
              <pre style={preStyle}>{JSON.stringify(props.issuedSession, null, 2)}</pre>
            ) : null}
            {props.sessionVerify ? (
              <pre style={preStyle}>{JSON.stringify(props.sessionVerify, null, 2)}</pre>
            ) : null}

            <CollapsibleCodeExample code={SESSION_KEY_SNIPPET} label="Session-key backend flow" />
          </div>
        </div>
      </section>

      <section
        id="compiler"
        style={props.activeSection === 'compiler' ? sectionStyle : { display: 'none' }}
      >
        <div style={{ padding: '24px', backgroundColor: '#1e1e1e' }}>
          <div
            style={{
              paddingBottom: '16px',
              borderBottom: '1px solid #3c3c3c',
              marginBottom: '24px',
            }}
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
              Compiler
            </h2>
            <p style={{ margin: 0, color: '#888', fontSize: '13px', lineHeight: 1.5 }}>
              Keep the source editor off the main canvas. Use the compiler sheet when you need to
              change source or rebuild the active artifact.
            </p>
          </div>
          <div style={stackStyle}>
            {props.compileError ? <div style={errorStyle}>{props.compileError}</div> : null}

            <div style={statsGridStyle}>
              <DevnodeStat
                label="Contract"
                value={props.artifact?.contractName ?? (props.contractName.trim() || 'Counter')}
              />
              <DevnodeStat label="solc" value={props.solcVersion} />
              <DevnodeStat label="Artifact" value={props.artifact ? 'ready' : 'not compiled'} />
              <DevnodeStat label="Source lines" value={String(props.source.split('\n').length)} />
            </div>

            <div style={buttonRowStyle}>
              <button type="button" onClick={() => props.onOpenDialog('compiler')}>
                {props.artifact ? 'Open compiler sheet' : 'Open compiler'}
              </button>
              <button
                type="button"
                disabled={!props.artifact}
                onClick={() => props.onSelectSection('deploy')}
              >
                Continue to deploy
              </button>
            </div>

            {props.artifact ? (
              <div style={stackStyle}>
                <div style={statsGridStyle}>
                  <DevnodeStat label="ABI items" value={String(props.artifact.abi.length)} />
                  <DevnodeStat
                    label="Bytecode bytes"
                    value={String(Math.max(0, (props.artifact.bytecode.length - 2) / 2))}
                  />
                </div>
                {props.artifact.warnings.length > 0 ? (
                  <pre style={preStyle}>
                    {props.artifact.warnings
                      .map((warning) => `${warning.severity}: ${warning.message}`)
                      .join('\n')}
                  </pre>
                ) : null}
              </div>
            ) : (
              <div style={noteStyle}>No compiled artifact is loaded yet.</div>
            )}

            <CollapsibleCodeExample code={COMPILER_SNIPPET} label="Compiler backend flow" />
          </div>
        </div>
      </section>
    </div>
  );
}
