'use client';

import { pageGridStyle } from './devnode/devnode-ui';
import { KeystorePanel } from './workspace-panels-keystore';
import { EnvironmentSetupPanel } from './workspace-panels-setup';
import type { ShowcaseWorkspacePanelsProps } from './workspace-panels-shared';

export function EnvironmentAndKeystorePanels(props: ShowcaseWorkspacePanelsProps) {
  return (
    <div style={pageGridStyle}>
      <EnvironmentSetupPanel {...props} />
      <KeystorePanel {...props} />
    </div>
  );
}
