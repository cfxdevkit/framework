'use client';

import { ContractContextPanel } from './workspace-panels-contract-context';
import { CustomOperationPanel } from './workspace-panels-custom-operation';
import { DeployPanel } from './workspace-panels-deploy';
import { EventLogPanel } from './workspace-panels-event-log';
import type { ShowcaseWorkspacePanelsProps } from './workspace-panels-shared';

export function ContractPanels(props: ShowcaseWorkspacePanelsProps) {
  return (
    <>
      <DeployPanel {...props} />
      <ContractContextPanel {...props} />
      <CustomOperationPanel {...props} />
      <EventLogPanel {...props} />
    </>
  );
}
