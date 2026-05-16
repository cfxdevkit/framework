'use client';

import { pageGridStyle } from '../devnode/devnode-ui';
import { AccountsPanel } from './accounts-section';
import { ComposePanels } from './compose';
import { ContractContextPanel } from './contract-context';
import { CustomOperationPanel } from './custom-operation';
import { DeployPanel } from './deploy';
import { DevnodePanel } from './devnode';
import { EventLogPanel } from './event-log';
import { KeystorePanel } from './keystore';
import { EnvironmentSetupPanel } from './setup';
import type { ShowcaseWorkspacePanelsProps } from './shared';

const detailPaneStyle = {
  display: 'grid',
  gap: 'var(--cfx-space-4)',
} as const;

export function ShowcaseWorkspacePanels(props: ShowcaseWorkspacePanelsProps) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1 }}>
        <div style={detailPaneStyle}>
          {props.activePanel ? (
            <div style={{ display: 'grid', gap: 'var(--cfx-space-1)' }}>
              <h2 style={{ fontSize: 'var(--cfx-text-xl)', margin: 0 }}>
                {props.activePanel.label}
              </h2>
              <p style={{ color: 'var(--cfx-color-fg-muted)', margin: 0 }}>
                {props.activePanel.blurb}
              </p>
            </div>
          ) : null}

          <div style={pageGridStyle}>
            <EnvironmentSetupPanel {...props} />
            <KeystorePanel {...props} />
          </div>

          <AccountsPanel {...props} />
          <DevnodePanel {...props} />
          <ComposePanels {...props} />

          <DeployPanel {...props} />
          <ContractContextPanel {...props} />
          <CustomOperationPanel {...props} />
          <EventLogPanel {...props} />
        </div>
      </div>
    </div>
  );
}
