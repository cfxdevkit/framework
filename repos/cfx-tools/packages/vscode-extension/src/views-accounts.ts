import * as vscode from 'vscode';
import { makeAddressItem, makeCommandItem, makeSection } from './views-common.js';
import type { ViewSnapshot, WalletRootRecord, WalletTreeItem } from './views-model.js';

export function makeAccountItems(snapshot: ViewSnapshot): vscode.TreeItem[] {
  const walletChildren = snapshot.walletRoots.map(makeWalletItem);
  walletChildren.push(
    makeCommandItem(
      'Add wallet',
      snapshot.walletRoots.length ? undefined : 'none yet',
      'cfxdevkit.addWallet',
      'add',
      'Create or import a mnemonic wallet in the encrypted workspace keystore.',
    ),
  );
  const wallets = makeSection('Wallets', 'account', walletChildren);
  if (snapshot.keystoreLocked) {
    const item = new vscode.TreeItem('Unlock active wallet to view accounts');
    item.description = snapshot.walletRoots.length ? 'locked' : 'add wallet first';
    item.iconPath = new vscode.ThemeIcon('lock');
    item.command = snapshot.walletRoots.length
      ? { command: 'cfxdevkit.unlockKeystore', title: 'Unlock Keystore' }
      : { command: 'cfxdevkit.addWallet', title: 'Add Wallet' };
    return [wallets, makeSection('Accounts', 'person', [item])];
  }
  if (!snapshot.accounts.length) {
    const item = new vscode.TreeItem('No accounts available');
    item.description = 'select or add a wallet';
    item.iconPath = new vscode.ThemeIcon('person');
    return [wallets, makeSection('Accounts', 'person', [item])];
  }
  const accounts = snapshot.accounts.map((account) => {
    const item = new vscode.TreeItem(
      account.label,
      account.espaceAddress || account.coreAddress
        ? vscode.TreeItemCollapsibleState.Collapsed
        : vscode.TreeItemCollapsibleState.None,
    ) as vscode.TreeItem & { children?: vscode.TreeItem[] };
    item.description =
      account.espaceAddress || account.coreAddress
        ? `eSpace ${account.espaceBalance ?? 'n/a'} | Core ${account.coreBalance ?? 'n/a'}`
        : account.description;
    item.tooltip = account.detail;
    item.contextValue = 'cfxAccountItem';
    // Store target so the inline "Select" inline button can call selectWallet
    // with the right wallet ref and index without relying on item.command args.
    if (account.walletRef && account.accountIndex !== undefined) {
      (item as unknown as { walletRef: unknown; accountIndex: number }).walletRef =
        account.walletRef;
      (item as unknown as { walletRef: unknown; accountIndex: number }).accountIndex =
        account.accountIndex;
    }
    if (account.walletRef && account.accountIndex !== undefined) {
      item.command = {
        command: 'cfxdevkit.selectWallet',
        title: `Select ${account.label}`,
        arguments: [{ walletRef: account.walletRef, accountIndex: account.accountIndex }],
      };
    }
    item.iconPath = new vscode.ThemeIcon(
      'account',
      new vscode.ThemeColor(
        account.state === 'locked' ? 'testing.iconQueued' : 'descriptionForeground',
      ),
    );
    item.children = [
      account.espaceAddress
        ? makeAddressItem('eSpace', account.espaceAddress, 'globe', account.espaceBalance)
        : undefined,
      account.coreAddress
        ? makeAddressItem('Core Space', account.coreAddress, 'symbol-key', account.coreBalance)
        : undefined,
    ].filter((child): child is vscode.TreeItem => child !== undefined);
    return item;
  });
  return [wallets, makeSection('Accounts', 'person', accounts)];
}

function makeWalletItem(wallet: WalletRootRecord): WalletTreeItem {
  const item = new vscode.TreeItem(wallet.label) as WalletTreeItem;
  item.description = wallet.active ? 'active' : wallet.description;
  item.tooltip = wallet.detail;
  item.walletRef = wallet.ref;
  item.accountIndex = 0;
  item.contextValue = wallet.active
    ? wallet.state === 'ready'
      ? 'cfxWalletActiveReady'
      : 'cfxWalletActiveLocked'
    : wallet.state === 'ready'
      ? 'cfxWalletReady'
      : 'cfxWalletLocked';
  item.iconPath = new vscode.ThemeIcon(
    wallet.active ? 'check' : wallet.state === 'locked' ? 'lock' : 'key',
  );
  item.command = {
    command: 'cfxdevkit.selectWallet',
    title: `Select ${wallet.label}`,
    arguments: [{ walletRef: wallet.ref, accountIndex: 0 }],
  };
  return item;
}
