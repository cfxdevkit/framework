'use client';

import { AccountsPanel } from './accounts-section';
import { ComposePanels } from './compose';
import { ContractContextPanel } from './contract-context';
import { CustomOperationPanel } from './custom-operation';
import { DeployPanel } from './deploy';
import { DevnodePanel } from './devnode';
import { KeystorePanel } from './keystore';
import { RevealPanel } from './reveal';
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
          <EnvironmentSetupPanel {...props} />
          <KeystorePanel {...props} />

          <AccountsPanel {...props} />
          <DevnodePanel {...props} />
          <ComposePanels {...props} />

          <DeployPanel {...props} />
          <ContractContextPanel {...props} />
          <CustomOperationPanel {...props} />
          <RevealPanel {...props} />
        </div>
      </div>
    </div>
  );
}
