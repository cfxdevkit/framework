import * as vscode from 'vscode';

export interface AccountTreeRecord {
  label: string;
  description?: string;
  address: string;
  detail?: string;
}

export interface ContractTreeRecord {
  id: string;
  label: string;
  description?: string;
  address: string;
  detail?: string;
}

export interface ViewSnapshot {
  selectedNetworkLabel: string;
  nodeStatusLabel: string;
  nodeActions: ReadonlyArray<{ label: string; command: string; detail?: string }>;
  accounts: ReadonlyArray<AccountTreeRecord>;
  contracts: ReadonlyArray<ContractTreeRecord>;
}

export class StaticTreeProvider<T extends vscode.TreeItem>
  implements vscode.TreeDataProvider<T>
{
  private readonly emitter = new vscode.EventEmitter<T | undefined | null | void>();
  readonly onDidChangeTreeData = this.emitter.event;

  private items: readonly T[] = [];

  setItems(items: readonly T[]): void {
    this.items = items;
    this.emitter.fire();
  }

  refresh(): void {
    this.emitter.fire();
  }

  getTreeItem(element: T): vscode.TreeItem {
    return element;
  }

  getChildren(): T[] {
    return [...this.items];
  }
}

export function makeNetworkItems(snapshot: ViewSnapshot): vscode.TreeItem[] {
  const current = new vscode.TreeItem(`Current: ${snapshot.selectedNetworkLabel}`);
  current.description = 'active network';
  current.iconPath = new vscode.ThemeIcon('globe');
  current.command = {
    command: 'cfxdevkit.selectNetwork',
    title: 'Select Network',
  };

  const change = new vscode.TreeItem('Change network');
  change.description = 'switch local / testnet / mainnet';
  change.iconPath = new vscode.ThemeIcon('chevron-right');
  change.command = {
    command: 'cfxdevkit.selectNetwork',
    title: 'Select Network',
  };

  return [current, change];
}

export function makeNodeItems(snapshot: ViewSnapshot): vscode.TreeItem[] {
  const status = new vscode.TreeItem(`Status: ${snapshot.nodeStatusLabel}`);
  status.iconPath = new vscode.ThemeIcon('server');
  const actions = snapshot.nodeActions.map((action) => {
    const item = new vscode.TreeItem(action.label);
    item.description = action.detail;
    item.command = { command: action.command, title: action.label };
    item.iconPath = new vscode.ThemeIcon('play-circle');
    return item;
  });
  return [status, ...actions];
}

export function makeAccountItems(snapshot: ViewSnapshot): vscode.TreeItem[] {
  if (!snapshot.accounts.length) {
    const item = new vscode.TreeItem('No accounts available');
    item.description = 'initialize wallet or start local node';
    item.iconPath = new vscode.ThemeIcon('person');
    return [item];
  }

  return snapshot.accounts.map((account) => {
    const item = new vscode.TreeItem(account.label);
    item.description = account.description;
    item.tooltip = `${account.address}${account.detail ? `\n${account.detail}` : ''}`;
    item.command = {
      command: 'cfxdevkit.copyAddress',
      title: 'Copy Address',
      arguments: [account.address],
    };
    item.contextValue = 'cfxAddressItem';
    item.iconPath = new vscode.ThemeIcon('person');
    return item;
  });
}

export function makeContractItems(snapshot: ViewSnapshot): vscode.TreeItem[] {
  if (!snapshot.contracts.length) {
    const item = new vscode.TreeItem('No deployed contracts recorded');
    item.description = 'deploy a contract to populate this view';
    item.iconPath = new vscode.ThemeIcon('file-code');
    return [item];
  }

  return snapshot.contracts.map((contract) => {
    const item = new vscode.TreeItem(contract.label);
    item.description = contract.description;
    item.tooltip = `${contract.address}${contract.detail ? `\n${contract.detail}` : ''}`;
    item.command = {
      command: 'cfxdevkit.copyContractAddress',
      title: 'Copy Contract Address',
      arguments: [contract.address],
    };
    item.contextValue = 'cfxContractItem';
    item.iconPath = new vscode.ThemeIcon('symbol-class');
    return item;
  });
}