'use client';

import { AccountsPanel } from './workspace-panels-accounts-section';
import { DevnodePanel } from './workspace-panels-devnode';
import type { ShowcaseWorkspacePanelsProps } from './workspace-panels-shared';

export function AccountsAndDevnodePanels(props: ShowcaseWorkspacePanelsProps) {
  return (
    <>
      <AccountsPanel {...props} />
      <DevnodePanel {...props} />
    </>
  );
}
