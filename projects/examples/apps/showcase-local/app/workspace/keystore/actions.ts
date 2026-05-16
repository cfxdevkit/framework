'use client';

import type {
  KeystoreWalletAccountSummary,
  KeystoreWalletSummary,
} from '../../../lib/keystore-types';
import {
  mineDevnode,
  restartDevnode,
  selectDevnodeProfile,
  startDevnode,
  stopDevnode,
} from '../../devnode/devnode-client';
import {
  activateKeystoreAccount,
  activateKeystoreWallet,
  createKeystoreWallet,
  deleteKeystoreWallet,
  renameKeystoreWallet,
  setupKeystore,
  unlockKeystore,
} from '../../keystore/keystore-client';
import type { ShowcaseWorkspaceDrafts } from '../drafts';
import { runDevnodeAction, runLocalFund, runLock, runPassphraseAction } from './helpers';
import type { ShowcaseWorkspaceKeystoreRuntime } from './runtime';

type WorkspaceLog = (message: string, level?: 'error') => void;

export function useShowcaseWorkspaceKeystoreActions({
  drafts,
  log,
  runtime,
}: {
  drafts: ShowcaseWorkspaceDrafts;
  log: WorkspaceLog;
  runtime: ShowcaseWorkspaceKeystoreRuntime;
}) {
  const runImportWallet = async () => {
    const nextMnemonic = drafts.mnemonicDraft.trim();
    if (!nextMnemonic) {
      const message = 'Mnemonic is required for import.';
      runtime.setKeystoreError(message);
      log(message, 'error');
      return;
    }
    const name = drafts.walletName.trim() || `Mnemonic ${runtime.wallets.length + 1}`;
    runtime.setKeystoreBusy('import');
    runtime.setKeystoreError(null);
    try {
      await createKeystoreWallet({ mnemonic: nextMnemonic, name });
      drafts.setWalletName('');
      await runtime.refreshKeystore({ silent: true });
      log(`Imported mnemonic ${name} into the backend keystore.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      runtime.setKeystoreError(message);
      log(message, 'error');
    } finally {
      runtime.setKeystoreBusy(null);
    }
  };

  const runCreateWallet = async () => {
    const name = drafts.walletName.trim() || `Mnemonic ${runtime.wallets.length + 1}`;
    runtime.setKeystoreBusy('create');
    runtime.setKeystoreError(null);
    try {
      await createKeystoreWallet({ name });
      drafts.setWalletName('');
      await runtime.refreshKeystore({ silent: true });
      log(`Generated mnemonic ${name} in the backend keystore.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      runtime.setKeystoreError(message);
      log(message, 'error');
    } finally {
      runtime.setKeystoreBusy(null);
    }
  };

  const runRenameWallet = async (wallet: KeystoreWalletSummary) => {
    const nextName = (runtime.walletNameDrafts[wallet.id] ?? '').trim();
    if (!nextName) {
      const message = 'Mnemonic label is required.';
      runtime.setKeystoreError(message);
      log(message, 'error');
      return;
    }
    if (nextName === wallet.name) return;
    runtime.setKeystoreBusy('rename');
    runtime.setWalletActionId(wallet.id);
    runtime.setKeystoreError(null);
    try {
      await renameKeystoreWallet(wallet.id, nextName);
      await runtime.refreshKeystore({ silent: true });
      log(`Renamed mnemonic ${wallet.name} to ${nextName}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      runtime.setKeystoreError(message);
      log(message, 'error');
    } finally {
      runtime.setKeystoreBusy(null);
      runtime.setWalletActionId(null);
    }
  };

  const runActivateWallet = async (wallet: KeystoreWalletSummary) => {
    runtime.setKeystoreBusy('activate');
    runtime.setWalletActionId(wallet.id);
    runtime.setKeystoreError(null);
    try {
      await activateKeystoreWallet(wallet.id);
      await runtime.refreshKeystore({ silent: true });
      log(`Activated wallet ${wallet.name}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      runtime.setKeystoreError(message);
      log(message, 'error');
    } finally {
      runtime.setKeystoreBusy(null);
      runtime.setWalletActionId(null);
    }
  };

  const runActivateAccount = async (account: KeystoreWalletAccountSummary) => {
    if (!runtime.activeWallet) return;
    runtime.setAccountsBusy('activate');
    runtime.setAccountActionIndex(account.index);
    runtime.setAccountsError(null);
    try {
      await activateKeystoreAccount(runtime.activeWallet.id, account.index);
      await runtime.refreshKeystore({ silent: true });
      log(`Activated account #${account.index} for ${runtime.activeWallet.name}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      runtime.setAccountsError(message);
      log(message, 'error');
    } finally {
      runtime.setAccountsBusy(null);
      runtime.setAccountActionIndex(null);
    }
  };

  const runDeleteWallet = async (wallet: KeystoreWalletSummary) => {
    runtime.setKeystoreBusy('delete');
    runtime.setWalletActionId(wallet.id);
    runtime.setKeystoreError(null);
    try {
      await deleteKeystoreWallet(wallet.id);
      await runtime.refreshKeystore({ silent: true });
      log(`Removed wallet ${wallet.name}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      runtime.setKeystoreError(message);
      log(message, 'error');
    } finally {
      runtime.setKeystoreBusy(null);
      runtime.setWalletActionId(null);
    }
  };

  const runSelectNodeProfile = async (wallet: KeystoreWalletSummary) => {
    runtime.setNodeProfileBusy('select');
    runtime.setNodeProfileActionId(wallet.id);
    runtime.setNodeProfileError(null);
    try {
      await selectDevnodeProfile(wallet.id);
      await runtime.refreshKeystore({ silent: true });
      log(`Selected node profile ${wallet.name}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      runtime.setNodeProfileError(message);
      log(message, 'error');
    } finally {
      runtime.setNodeProfileBusy(null);
      runtime.setNodeProfileActionId(null);
    }
  };

  return {
    mineBlocks: () =>
      runDevnodeAction({
        action: 'mine',
        log,
        request: () => mineDevnode({ count: Number(drafts.mineCount) }),
        runtime,
        successMessage: () => `Mined ${drafts.mineCount} block(s)`,
      }),
    restartDevnodeAction: () =>
      runDevnodeAction({
        action: 'restart',
        log,
        request: restartDevnode,
        runtime,
        successMessage: () => 'Restarted DevNode',
      }),
    runActivateAccount,
    runActivateWallet,
    runCreateWallet,
    runDeleteWallet,
    runImportWallet,
    runRenameWallet,
    runSelectNodeProfile,
    runLocalFund: () => runLocalFund(drafts, log, runtime),
    runLock: () => runLock(log, runtime),
    setupKeystoreAction: () =>
      runPassphraseAction({
        action: 'setup',
        drafts,
        log,
        request: setupKeystore,
        runtime,
        successMessage: 'Keystore setup completed',
      }),
    startDevnodeAction: () =>
      runDevnodeAction({
        action: 'start',
        log,
        request: startDevnode,
        runtime,
        successMessage: () => 'Started DevNode',
      }),
    stopDevnodeAction: () =>
      runDevnodeAction({
        action: 'stop',
        log,
        request: stopDevnode,
        runtime,
        successMessage: () => 'Stopped DevNode',
      }),
    unlockKeystoreAction: () =>
      runPassphraseAction({
        action: 'unlock',
        drafts,
        log,
        request: unlockKeystore,
        runtime,
        successMessage: 'Keystore unlocked',
      }),
  };
}

export type ShowcaseWorkspaceKeystoreActions = ReturnType<
  typeof useShowcaseWorkspaceKeystoreActions
>;
