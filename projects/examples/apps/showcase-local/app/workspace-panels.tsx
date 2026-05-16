'use client';

import { AccountsAndDevnodePanels } from './workspace-panels-accounts';
import { ComposePanels } from './workspace-panels-compose';
import { ContractPanels } from './workspace-panels-contracts';
import { EnvironmentAndKeystorePanels } from './workspace-panels-environment';
import type { ShowcaseWorkspacePanelsProps } from './workspace-panels-shared';

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

          <EnvironmentAndKeystorePanels {...props} />
          <AccountsAndDevnodePanels {...props} />
          <ComposePanels {...props} />
          <ContractPanels {...props} />
        </div>
      </div>
    </div>
  );
}
