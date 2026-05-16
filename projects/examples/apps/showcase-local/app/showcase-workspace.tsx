'use client';

import { useLogList } from '@cfxdevkit/example-showcase-ui';
import { useEffect, useMemo, useState } from 'react';
import { ShowcaseWorkspaceDialogs } from './dialogs';
import { getPanel } from './panels/registry';
import { ShowcaseWorkspaceLoadingShell, ShowcaseWorkspaceShell } from './shell';
import { useShowcaseWorkspaceCompose } from './workspace/compose';
import { useShowcaseWorkspaceDrafts } from './workspace/drafts';
import { useShowcaseWorkspaceKeystoreActions } from './workspace/keystore/actions';
import { useShowcaseWorkspaceKeystoreRuntime } from './workspace/keystore/runtime';
import type { WorkspaceDialogId, WorkspaceSectionId } from './workspace/shared';

export type {
  CompileArtifact,
  CustomBlockNumberResponse,
  DeployResponse,
  NetworkId,
  SessionKeyIssueResponse,
  SessionKeyVerifyResponse,
  SpaceId,
  WorkspaceSectionId,
} from './workspace/shared';

export function ShowcaseWorkspace() {
  const drafts = useShowcaseWorkspaceDrafts();
  const [activeDialog, setActiveDialog] = useState<WorkspaceDialogId>(null);
  const { clear, entries, log } = useLogList();
  const activePanel = useMemo(
    () => getPanel(drafts.activeSection, drafts.network),
    [drafts.activeSection, drafts.network],
  );
  const keystore = useShowcaseWorkspaceKeystoreRuntime({
    log,
    network: drafts.network,
    space: drafts.space,
  });
  const keystoreActions = useShowcaseWorkspaceKeystoreActions({ drafts, log, runtime: keystore });
  const compose = useShowcaseWorkspaceCompose({
    closeDialog: () => setActiveDialog(null),
    drafts,
    log,
  });

  useEffect(() => {
    if (drafts.network !== 'local' && drafts.activeSection === 'devnode') {
      drafts.setActiveSection('setup');
    }
  }, [drafts.activeSection, drafts.network, drafts.setActiveSection]);

  useEffect(() => {
    if (!activePanel) {
      drafts.setActiveSection('setup');
    }
  }, [activePanel, drafts.setActiveSection]);

  if (!drafts.storageReady) {
    return <ShowcaseWorkspaceLoadingShell />;
  }

  const selectSection = (section: WorkspaceSectionId) => {
    if (section === 'devnode' && drafts.network !== 'local') {
      drafts.setActiveSection('setup');
      return;
    }
    drafts.setActiveSection(section);
  };

  return (
    <>
      <ShowcaseWorkspaceShell
        activePanel={activePanel}
        clearLog={clear}
        compose={compose}
        drafts={drafts}
        entries={entries}
        keystore={keystore}
        keystoreActions={keystoreActions}
        onOpenDialog={setActiveDialog}
        onSelectSection={selectSection}
      />
      <ShowcaseWorkspaceDialogs
        activeDialog={activeDialog}
        activeWalletName={keystore.activeWallet?.name ?? null}
        compose={compose}
        drafts={drafts}
        onClose={() => setActiveDialog(null)}
      />
    </>
  );
}
