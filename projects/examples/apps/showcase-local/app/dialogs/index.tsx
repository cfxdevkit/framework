'use client';

import { useEffect } from 'react';
import type { ShowcaseWorkspaceCompose } from '../workspace/compose';
import type { ShowcaseWorkspaceDrafts } from '../workspace/drafts';
import type { WorkspaceDialogId } from '../workspace/shared';
import { ShowcaseWorkspaceDialogContent } from './content';

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
