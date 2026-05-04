import * as vscode from 'vscode';
import { makeAddressItem, makeCommandItem, makeSection } from './views-common.js';
import type { ViewSnapshot, WalletRootRecord, WalletTreeItem } from './views-model.js';

export function makeAccountItems(snapshot: ViewSnapshot): vscode.TreeItem[] {
  const backendChildren = [
    makeCommandItem(
      `Current: ${snapshot.selectedKeystoreBackendLabel}`,
      'change backend',
      'cfxdevkit.selectKeystoreBackend',
      'server-environment',
      `Signing backend: ${snapshot.selectedKeystoreBackendLabel}`,
    ),
    ...snapshot.keystoreBackendOptions.map((option) => {
      const item = makeCommandItem(
        option.label,
        option.selected ? 'active' : option.description,
        'cfxdevkit.selectKeystoreBackend',
        option.selected ? 'check' : 'circle-large-outline',
        option.description,
      );
      item.command = {
        command: 'cfxdevkit.selectKeystoreBackend',
        title: `Use ${option.label}`,
        arguments: [option.backend],
      };
      return item;
    }),
  ];
  if (snapshot.selectedKeystoreBackendId === 'file') {
    backendChildren.push(
      makeCommandItem(
        'Keystore file',
        snapshot.selectedKeystorePathLabel,
        'cfxdevkit.selectKeystoreFile',
        'folder',
        'Select the encrypted file used when the File backend is active.',
      ),
    );
  }
  const backend = makeSection('Keystore', 'key', backendChildren);
  const walletChildren =
    snapshot.selectedKeystoreBackendId === 'file'
      ? snapshot.walletRoots.map(makeWalletItem)
      : [
          makeCommandItem(
            'Hardware wallet',
            snapshot.selectedKeystoreBackendLabel,
            'cfxdevkit.unlockKeystore',
            'plug',
            'Connect the selected hardware wallet backend.',
          ),
        ];
  if (snapshot.selectedKeystoreBackendId === 'file') {
    walletChildren.push(
      makeCommandItem(
        'Add wallet',
        snapshot.walletRoots.length ? undefined : 'none yet',
        'cfxdevkit.addWallet',
        'add',
        'Create or import a mnemonic wallet in the selected keystore.',
      ),
    );
  }
  const wallets = makeSection('Wallets', 'account', walletChildren);
  if (!snapshot.accounts.length) {
    const item = new vscode.TreeItem('No accounts available');
    item.description = 'select a wallet or connect hardware';
    item.iconPath = new vscode.ThemeIcon('person');
    return [backend, wallets, makeSection('Accounts', 'person', [item])];
  }
  const accounts = snapshot.accounts.map((account) => {
    const item = new vscode.TreeItem(
      account.label,
      account.espaceAddress || account.coreAddress
        ? vscode.TreeItemCollapsibleState.Collapsed
        : vscode.TreeItemCollapsibleState.None,
    ) as vscode.TreeItem & { children?: vscode.TreeItem[] };
    item.description =
      account.espaceBalance || account.coreBalance
        ? `eSpace ${account.espaceBalance ?? 'n/a'} | Core ${account.coreBalance ?? 'n/a'}`
        : account.description;
    item.tooltip = account.detail;
    item.contextValue = 'cfxAccountItem';
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
  return [backend, wallets, makeSection('Accounts', 'person', accounts)];
}

function makeWalletItem(wallet: WalletRootRecord): WalletTreeItem {
  const item = new vscode.TreeItem(wallet.label) as WalletTreeItem;
  item.description = wallet.active ? 'active' : wallet.description;
  item.tooltip = wallet.detail;
  item.walletRef = wallet.ref;
  item.accountIndex = 0;
  item.contextValue = wallet.active
    ? wallet.state === 'ready'
      ? 'cfxWalletRootActiveReady'
      : 'cfxWalletRootActiveLocked'
    : wallet.state === 'ready'
      ? 'cfxWalletRootReady'
      : 'cfxWalletRootLocked';
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
