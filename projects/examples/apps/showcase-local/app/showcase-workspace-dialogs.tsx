'use client';

import { useEffect } from 'react';
import type { ShowcaseWorkspaceCompose } from './showcase-workspace-compose';
import { ShowcaseWorkspaceDialogContent } from './showcase-workspace-dialog-content';
import type { ShowcaseWorkspaceDrafts } from './showcase-workspace-drafts';
import type { WorkspaceDialogId } from './showcase-workspace-shared';

export function ShowcaseWorkspaceDialogs({
  activeDialog,
  activeWalletName,
  compose,
  drafts,
  onClose,
}: {
  activeDialog: WorkspaceDialogId;
  activeWalletName: string | null;
  compose: ShowcaseWorkspaceCompose;
  drafts: ShowcaseWorkspaceDrafts;
  onClose(): void;
}) {
  useEffect(() => {
    if (!activeDialog) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeDialog, onClose]);
  return (
    <ShowcaseWorkspaceDialogContent
      activeDialog={activeDialog}
      activeWalletName={activeWalletName}
      compose={compose}
      drafts={drafts}
      onClose={onClose}
    />
  );
}
