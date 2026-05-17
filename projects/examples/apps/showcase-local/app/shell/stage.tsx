'use client';

import type { LogBox } from '@cfxdevkit/example-showcase-ui';
import { ShowcaseWorkspacePanels } from '../panels';
import type { LocalPanelSpec } from '../panels/registry';
import type { ShowcaseWorkspaceCompose } from '../workspace/compose';
import type { ShowcaseWorkspaceDrafts } from '../workspace/drafts';
import type { ShowcaseWorkspaceKeystoreActions } from '../workspace/keystore/actions';
import type { ShowcaseWorkspaceKeystoreRuntime } from '../workspace/keystore/runtime';
import type { WorkspaceDialogId, WorkspaceSectionId } from '../workspace/shared';
import { WORKSPACE_STEPS } from '../workspace/shared';

export type LogEntries = React.ComponentProps<typeof LogBox>['entries'];

export interface ShowcaseWorkspaceShellProps {
  activePanel: LocalPanelSpec | null;
  clearLog(): void;
  compose: ShowcaseWorkspaceCompose;
  drafts: ShowcaseWorkspaceDrafts;
  entries: LogEntries;
  keystore: ShowcaseWorkspaceKeystoreRuntime;
  keystoreActions: ShowcaseWorkspaceKeystoreActions;
  onOpenDialog(dialog: Exclude<WorkspaceDialogId, null>): void;
  onSelectSection(section: WorkspaceSectionId): void;
}

export function resolveWorkspaceSteps(section: WorkspaceSectionId) {
  const stepIndex = WORKSPACE_STEPS.indexOf(section as (typeof WORKSPACE_STEPS)[number]);
  return {
    nextStep:
      stepIndex >= 0 && stepIndex < WORKSPACE_STEPS.length - 1
        ? WORKSPACE_STEPS[stepIndex + 1]
        : null,
    previousStep: stepIndex > 0 ? WORKSPACE_STEPS[stepIndex - 1] : null,
    stepIndex,
  };
}

export function ShowcaseWorkspacePanelStage({
  activePanel,
  clearLog,
  compose,
  drafts,
  entries,
  keystore,
  keystoreActions,
  onOpenDialog,
  onSelectSection,
}: ShowcaseWorkspaceShellProps) {
  return (
    <ShowcaseWorkspacePanels
      accountsBusy={keystore.accountsBusy}
      accountsError={keystore.accountsError}
      accountActionIndex={keystore.accountActionIndex}
      activePanel={activePanel}
      activeSection={drafts.activeSection}
      activeWallet={keystore.activeWallet}
      artifact={compose.artifact}
      clearLog={clearLog}
      compileBusy={compose.compileBusy}
      compileError={compose.compileError}
      contractName={drafts.contractName}
      contracts={compose.contracts}
      contractsBusy={compose.contractsBusy}
      customBlockError={compose.customBlockError}
      customBlockResult={compose.customBlockResult}
      deployBusy={compose.deployBusy}
      deployError={compose.deployError}
      deployResult={compose.deployResult}
      devnode={keystore.devnode}
      devnodeAccounts={keystore.devnodeAccounts}
      devnodeBadge={keystore.devnodeBadge}
      devnodeBusy={keystore.devnodeBusy}
      devnodeError={keystore.devnodeError}
      entries={entries}
      environmentFaucets={keystore.environmentFaucets}
      faucet={keystore.faucet}
      faucetAddress={drafts.faucetAddress}
      faucetAmount={drafts.faucetAmount}
      faucetBusy={keystore.faucetBusy}
      faucetError={keystore.faucetError}
      issuedSession={compose.issuedSession}
      keystoreBadge={keystore.keystoreBadge}
      keystoreBusy={keystore.keystoreBusy}
      keystoreError={keystore.keystoreError}
      keystoreReady={keystore.keystoreReady}
      keystoreStatus={keystore.keystoreStatus}
      localRpc={keystore.localRpc}
      localWriteBlocked={keystore.localWriteBlocked}
      mineCount={drafts.mineCount}
      mnemonicDraft={drafts.mnemonicDraft}
      network={drafts.network}
      nodeProfileActionId={keystore.nodeProfileActionId}
      nodeProfileBusy={keystore.nodeProfileBusy}
      nodeProfileError={keystore.nodeProfileError}
      nodeProfileLocked={keystore.nodeProfileLocked}
      nodeProfiles={keystore.nodeProfiles}
      passphrase={drafts.passphrase}
      readyForWrite={keystore.readyForWrite}
      selectedContract={compose.selectedContract}
      selectedContractFunctions={compose.selectedContractFunctions}
      selectedContractId={compose.selectedContractId}
      selectedFaucet={keystore.selectedFaucet}
      selectedNodeProfile={keystore.selectedNodeProfile}
      sessionBusy={compose.sessionBusy}
      sessionContracts={drafts.sessionContracts}
      sessionError={compose.sessionError}
      sessionMaxValue={drafts.sessionMaxValue}
      sessionSelectors={drafts.sessionSelectors}
      sessionTtlMinutes={drafts.sessionTtlMinutes}
      sessionVerify={compose.sessionVerify}
      solcVersion={drafts.solcVersion}
      source={drafts.source}
      space={drafts.space}
      walletAccountCount={drafts.walletAccountCount}
      walletAccounts={keystore.walletAccounts}
      walletActionId={keystore.walletActionId}
      walletName={drafts.walletName}
      walletNameDrafts={keystore.walletNameDrafts}
      wallets={keystore.wallets}
      onActivateAccount={keystoreActions.runActivateAccount}
      onActivateWallet={keystoreActions.runActivateWallet}
      onCreateWallet={keystoreActions.runCreateWallet}
      onDeleteWallet={keystoreActions.runDeleteWallet}
      onImportWallet={keystoreActions.runImportWallet}
      onLoadSelectedContractIntoSession={compose.loadSelectedContractIntoSession}
      onLocalFund={() => void keystoreActions.runLocalFund()}
      onMineBlocks={() => void keystoreActions.mineBlocks()}
      onOpenDialog={onOpenDialog}
      onRefreshContracts={() => void compose.refreshContracts()}
      onRefreshDevnode={() => void keystore.refreshDevnode()}
      onRefreshKeystore={() => void keystore.refreshKeystore()}
      onRenameWallet={keystoreActions.runRenameWallet}
      onRestartDevnode={() => void keystoreActions.restartDevnodeAction()}
      onRunLock={() => void keystoreActions.runLock()}
      onRunSetupKeystore={() => void keystoreActions.setupKeystoreAction()}
      onRunUnlockKeystore={() => void keystoreActions.unlockKeystoreAction()}
      onSelectContract={compose.setSelectedContractId}
      onSelectNodeProfile={keystoreActions.runSelectNodeProfile}
      onSelectSection={onSelectSection}
      onSetFaucetAddress={drafts.setFaucetAddress}
      onSetFaucetAmount={drafts.setFaucetAmount}
      onSetMineCount={drafts.setMineCount}
      onSetMnemonicDraft={drafts.setMnemonicDraft}
      onSetPassphrase={drafts.setPassphrase}
      onSetSpace={drafts.setSpace}
      onSetWalletAccountCount={drafts.setWalletAccountCount}
      onSetWalletName={drafts.setWalletName}
      onSetWalletNameDraft={(id, value) =>
        keystore.setWalletNameDrafts((prev) => ({ ...prev, [id]: value }))
      }
      onStartDevnode={() => void keystoreActions.startDevnodeAction()}
      onStopDevnode={() => void keystoreActions.stopDevnodeAction()}
      onWipeDevnode={() => void keystoreActions.wipeDevnodeAction()}
      onVerifySession={() => void compose.runVerifySession()}
    />
  );
}
