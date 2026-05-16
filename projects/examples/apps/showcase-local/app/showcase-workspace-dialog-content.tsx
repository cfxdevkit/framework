'use client';

import type { ReactNode } from 'react';
import type { ShowcaseWorkspaceCompose } from './showcase-workspace-compose';
import {
  CompilerDialogBody,
  CustomOperationDialogBody,
  DeployDialogBody,
  SessionKeyDialogBody,
} from './showcase-workspace-dialog-bodies';
import type { ShowcaseWorkspaceDrafts } from './showcase-workspace-drafts';
import type { WorkspaceDialogId } from './showcase-workspace-shared';

const dialogBackdropStyle = {
  alignItems: 'center',
  background: 'rgba(2, 6, 23, 0.7)',
  display: 'grid',
  inset: 0,
  padding: 'var(--cfx-space-4)',
  position: 'fixed',
  zIndex: 40,
} as const;

const dialogPanelStyle = {
  background: 'var(--cfx-color-bg-surface)',
  border: '1px solid var(--cfx-color-border-default)',
  borderRadius: 'var(--cfx-radius-lg)',
  boxShadow: '0 24px 80px rgba(2, 6, 23, 0.45)',
  display: 'grid',
  gap: 'var(--cfx-space-4)',
  maxHeight: 'min(88vh, 980px)',
  overflow: 'hidden',
  width: 'min(860px, calc(100vw - 2rem))',
} as const;

const dialogBackdropButtonStyle = {
  background: 'transparent',
  border: 'none',
  inset: 0,
  padding: 0,
  position: 'absolute',
} as const;

const dialogHeaderStyle = {
  borderBottom: '1px solid var(--cfx-color-border-default)',
  display: 'grid',
  gap: 'var(--cfx-space-1)',
  padding: 'var(--cfx-space-4) var(--cfx-space-4) 0',
} as const;

const dialogBodyStyle = {
  display: 'grid',
  gap: 'var(--cfx-space-4)',
  overflowY: 'auto',
  padding: '0 var(--cfx-space-4) var(--cfx-space-4)',
} as const;

export function ShowcaseWorkspaceDialogContent({
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
  if (!activeDialog) {
    return null;
  }

  if (activeDialog === 'compiler') {
    return (
      <WorkspaceDialog
        description="Edit source and compile without permanently occupying the main workspace pane."
        onClose={onClose}
        title="Compiler Sheet"
      >
        <CompilerDialogBody compose={compose} drafts={drafts} onClose={onClose} />
      </WorkspaceDialog>
    );
  }

  if (activeDialog === 'deploy') {
    return (
      <WorkspaceDialog
        description="Choose the family target here. The network stays inherited from the workspace environment."
        onClose={onClose}
        title="Deploy Sheet"
      >
        <DeployDialogBody
          activeWalletName={activeWalletName}
          compose={compose}
          drafts={drafts}
          onClose={onClose}
        />
      </WorkspaceDialog>
    );
  }

  if (activeDialog === 'session-key') {
    return (
      <WorkspaceDialog
        description="Compose the delegated capability here without flooding the main pane with form controls."
        onClose={onClose}
        title="Session Composer"
      >
        <SessionKeyDialogBody
          activeWalletName={activeWalletName}
          compose={compose}
          drafts={drafts}
          onClose={onClose}
        />
      </WorkspaceDialog>
    );
  }

  return (
    <WorkspaceDialog
      description="Reads the current block number from the selected network via the devnode-server API."
      onClose={onClose}
      title="Custom Backend Call"
    >
      <CustomOperationDialogBody compose={compose} drafts={drafts} onClose={onClose} />
    </WorkspaceDialog>
  );
}

function WorkspaceDialog({
  children,
  description,
  onClose,
  title,
}: {
  children: ReactNode;
  description: string;
  onClose(): void;
  title: string;
}) {
  return (
    <div style={dialogBackdropStyle}>
      <button
        type="button"
        aria-label="Close dialog"
        onClick={onClose}
        style={dialogBackdropButtonStyle}
      />
      <div style={dialogPanelStyle}>
        <div style={dialogHeaderStyle}>
          <h2 style={{ margin: 0, fontSize: 'var(--cfx-text-lg)', fontWeight: 600 }}>{title}</h2>
          <p
            style={{
              margin: 0,
              color: 'var(--cfx-color-fg-muted)',
              fontSize: 'var(--cfx-text-sm)',
              lineHeight: 1.5,
            }}
          >
            {description}
          </p>
        </div>
        <div style={dialogBodyStyle}>{children}</div>
      </div>
    </div>
  );
}
