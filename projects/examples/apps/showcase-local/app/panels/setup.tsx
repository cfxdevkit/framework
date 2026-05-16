'use client';

import { DEVNODE_API_SNIPPET } from '../../lib/showcase-guide';
import {
  buttonRowStyle,
  DevnodeStat,
  labelStyle,
  noteStyle,
  stackStyle,
  statsGridStyle,
} from '../devnode/devnode-ui';
import {
  CollapsibleCodeExample,
  chainIdFor,
  type ShowcaseWorkspacePanelsProps,
  sectionStyle,
} from './shared';

export function EnvironmentSetupPanel(props: ShowcaseWorkspacePanelsProps) {
  return (
    <section
      id="setup"
      style={props.activeSection === 'setup' ? sectionStyle : { display: 'none' }}
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
            Environment
          </h2>
          <p style={{ margin: 0, color: '#888', fontSize: '13px', lineHeight: 1.5 }}>
            The active network now lives in the top header. Core and eSpace still stay available
            together; the action sheets pick which family they target when needed.
          </p>
        </div>
        <div style={stackStyle}>
          <div style={statsGridStyle}>
            <DevnodeStat label="Core chain" value={String(chainIdFor(props.network, 'core'))} />
            <DevnodeStat label="eSpace chain" value={String(chainIdFor(props.network, 'espace'))} />
            <DevnodeStat
              label="Write path"
              value={props.network === 'local' ? 'local devnode' : `${props.network} RPC`}
            />
            <DevnodeStat
              label="Node profile"
              value={props.selectedNodeProfile?.name ?? 'choose below'}
            />
          </div>

          <div style={noteStyle}>
            {props.network === 'local'
              ? 'Mnemonic roots are managed in the backend keystore below. The local node exposes Core and eSpace together from the selected profile.'
              : 'Public-network actions reuse the same backend keystore signer. No browser wallet is involved, and each action can target either family.'}
          </div>

          <div style={stackStyle}>
            <span style={labelStyle}>Faucet / help</span>
            <div style={buttonRowStyle}>
              {props.environmentFaucets.map((link) => (
                <a key={link.href} href={link.href} rel="noreferrer" target="_blank">
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          <CollapsibleCodeExample
            code={DEVNODE_API_SNIPPET}
            label="Setup + devnode route surface"
          />
        </div>
      </div>
    </section>
  );
}
