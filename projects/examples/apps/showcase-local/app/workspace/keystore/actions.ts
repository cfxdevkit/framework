'use client';

import { generateMnemonic } from '@cfxdevkit/core';
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
  wipeDevnode,
} from '../../devnode/devnode-client';
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
    const accountCount = readWalletAccountCount(drafts.walletAccountCount);
    if (!nextMnemonic) {
      log('Mnemonic is required for import.', 'error');
      return;
    }
    if (accountCount === null) {
      log('Account count must be an integer between 1 and 50.', 'error');
      return;
    }
    const name = drafts.walletName.trim() || `Mnemonic ${runtime.wallets.length + 1}`;
    try {
      await runtime.addWallet({ mnemonic: nextMnemonic, name, accountCount });
      drafts.setWalletName('');
      log(`Imported mnemonic ${name} into the backend keystore.`);
    } catch (error) {
      log(error instanceof Error ? error.message : String(error), 'error');
    }
  };

  const runCreateWallet = async () => {
    const accountCount = readWalletAccountCount(drafts.walletAccountCount);
    if (accountCount === null) {
      log('Account count must be an integer between 1 and 50.', 'error');
      return;
    }
    const name = drafts.walletName.trim() || `Mnemonic ${runtime.wallets.length + 1}`;
    try {
      await runtime.addWallet({ mnemonic: generateMnemonic(128), name, accountCount });
      drafts.setWalletName('');
      log(`Generated mnemonic ${name} in the backend keystore.`);
    } catch (error) {
      log(error instanceof Error ? error.message : String(error), 'error');
    }
  };

  const runRenameWallet = async (wallet: KeystoreWalletSummary) => {
    const nextName = (runtime.walletNameDrafts[wallet.id] ?? '').trim();
    if (!nextName) {
      log('Mnemonic label is required.', 'error');
      return;
    }
    if (nextName === wallet.name) return;
    try {
      await runtime.renameWallet(wallet.id, nextName);
      log(`Renamed mnemonic ${wallet.name} to ${nextName}.`);
    } catch (error) {
      log(error instanceof Error ? error.message : String(error), 'error');
    }
  };

  const runActivateWallet = async (wallet: KeystoreWalletSummary) => {
    try {
      await runtime.activateWallet(wallet.id);
      log(`Activated wallet ${wallet.name}.`);
    } catch (error) {
      log(error instanceof Error ? error.message : String(error), 'error');
    }
  };

  const runActivateAccount = async (account: KeystoreWalletAccountSummary) => {
    if (!runtime.activeWallet) return;
    try {
      await runtime.activateAccount(runtime.activeWallet.id, account.index);
      log(`Activated account #${account.index} for ${runtime.activeWallet.name}.`);
    } catch (error) {
      log(error instanceof Error ? error.message : String(error), 'error');
    }
  };

  const runDeleteWallet = async (wallet: KeystoreWalletSummary) => {
    try {
      await runtime.deleteWallet(wallet.id);
      log(`Removed wallet ${wallet.name}.`);
    } catch (error) {
      log(error instanceof Error ? error.message : String(error), 'error');
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
        request: (passphrase) => runtime.setup(passphrase),
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
    wipeDevnodeAction: () =>
      runDevnodeAction({
        action: 'wipe',
        log,
        request: wipeDevnode,
        runtime,
        successMessage: () => 'Wiped local node data',
      }),
    unlockKeystoreAction: () =>
      runPassphraseAction({
        action: 'unlock',
        drafts,
        log,
        request: (passphrase) => runtime.unlock(passphrase),
        runtime,
        successMessage: 'Keystore unlocked',
      }),
  };
}

export type ShowcaseWorkspaceKeystoreActions = ReturnType<
  typeof useShowcaseWorkspaceKeystoreActions
>;

function readWalletAccountCount(value: string): number | null {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 50) {
    return null;
  }
  return parsed;
}
