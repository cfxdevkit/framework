import * as vscode from 'vscode';

export interface AccountTreeRecord {
  label: string;
  description?: string;
  espaceAddress?: string;
  coreAddress?: string;
  espaceBalance?: string;
  coreBalance?: string;
  detail?: string;
  state?: 'ready' | 'locked' | 'unavailable';
}

export interface AccountActionRecord {
  label: string;
  command: string;
  description?: string;
  icon?: string;
}

export interface ContractTreeRecord {
  id: string;
  label: string;
  description?: string;
  address: string;
  network: string;
  target: 'espace' | 'core';
  chainId: number;
  detail?: string;
  abi?: unknown[];
}

export interface NetworkTreeRecord {
  label: string;
  description: string;
  network: 'local' | 'testnet' | 'mainnet';
  coreChainId: number;
  espaceChainId: number;
  selected: boolean;
}

export interface AbiFunctionTreeRecord {
  name: string;
  type?: string;
  stateMutability?: string;
  inputs?: ReadonlyArray<{ name?: string; type: string }>;
}

export interface ViewSnapshot {
  selectedNetworkLabel: string;
  selectedSpaceLabel: string;
  selectedKeystoreBackendLabel: string;
  selectedKeystorePathLabel: string;
  networkOptions: ReadonlyArray<NetworkTreeRecord>;
  nodeStatusLabel: string;
  nodeActions: ReadonlyArray<{ label: string; command: string; detail?: string }>;
  accountActions: ReadonlyArray<AccountActionRecord>;
  accounts: ReadonlyArray<AccountTreeRecord>;
  contracts: ReadonlyArray<ContractTreeRecord>;
}

export class StaticTreeProvider<T extends vscode.TreeItem> implements vscode.TreeDataProvider<T> {
  private readonly emitter = new vscode.EventEmitter<T | undefined | null>();
  readonly onDidChangeTreeData = this.emitter.event;

  private items: readonly T[] = [];

  setItems(items: readonly T[]): void {
    this.items = items;
    this.emitter.fire(undefined);
  }

  refresh(): void {
    this.emitter.fire(undefined);
  }

  getTreeItem(element: T): vscode.TreeItem {
    return element;
  }

  getChildren(element?: T): T[] {
    const children = (element as (T & { children?: readonly T[] }) | undefined)?.children;
    if (children) return [...children];
    return element ? [] : [...this.items];
  }
}

export function makeNetworkItems(snapshot: ViewSnapshot): vscode.TreeItem[] {
  const current = new vscode.TreeItem(`Current: ${snapshot.selectedNetworkLabel}`);
  current.description = `Core + eSpace active`;
  current.iconPath = new vscode.ThemeIcon('globe');
  current.command = {
    command: 'cfxdevkit.selectNetwork',
    title: 'Select Network',
  };

  const options = snapshot.networkOptions.map((option) => {
    const item = new vscode.TreeItem(option.label);
    item.description = option.selected ? 'active' : option.description;
    item.tooltip = `${option.label}\n${option.description}`;
    item.iconPath = new vscode.ThemeIcon(
      option.network === 'local'
        ? option.selected
          ? 'server-environment'
          : 'server'
        : option.network === 'testnet'
          ? 'beaker'
          : 'globe',
      new vscode.ThemeColor(option.selected ? 'testing.iconPassed' : 'descriptionForeground'),
    );
    item.contextValue = option.selected ? 'cfxNetworkSelected' : 'cfxNetworkOption';
    if (!option.selected) {
      item.command = {
        command: 'cfxdevkit.selectNetwork',
        title: `Switch to ${option.label}`,
        arguments: [option.network],
      };
    }
    return item;
  });

  return [current, ...options];
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
  const backend = new vscode.TreeItem(`Keystore: ${snapshot.selectedKeystoreBackendLabel}`);
  backend.description = snapshot.selectedKeystorePathLabel;
  backend.tooltip = `Backend: ${snapshot.selectedKeystoreBackendLabel}\nKeystore: ${snapshot.selectedKeystorePathLabel}`;
  backend.iconPath = new vscode.ThemeIcon('key');
  backend.command = {
    command: 'cfxdevkit.selectKeystoreBackend',
    title: 'Select Keystore Backend',
  };

  const actions = snapshot.accountActions.map((action) => {
    const item = new vscode.TreeItem(action.label);
    item.description = action.description;
    item.iconPath = new vscode.ThemeIcon(action.icon ?? 'gear');
    item.command = { command: action.command, title: action.label };
    return item;
  });

  if (!snapshot.accounts.length) {
    const item = new vscode.TreeItem('No accounts available');
    item.description = 'initialize, unlock, or connect wallet';
    item.iconPath = new vscode.ThemeIcon('person');
    return [backend, ...actions, item];
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

  return [backend, ...actions, ...accounts];
}

export function makeContractItems(snapshot: ViewSnapshot): vscode.TreeItem[] {
  if (!snapshot.contracts.length) {
    const item = new vscode.TreeItem('No deployed contracts recorded');
    item.description = 'deploy a contract to populate this view';
    item.iconPath = new vscode.ThemeIcon('file-code');
    return [item];
  }

  const byNetwork = new Map<string, ContractTreeRecord[]>();
  for (const contract of snapshot.contracts) {
    const list = byNetwork.get(contract.network) ?? [];
    list.push(contract);
    byNetwork.set(contract.network, list);
  }

  return [...byNetwork.entries()].map(([network, contracts]) => {
    const networkItem = new vscode.TreeItem(
      labelNetwork(network),
      vscode.TreeItemCollapsibleState.Expanded,
    ) as vscode.TreeItem & { children?: vscode.TreeItem[] };
    networkItem.description =
      labelNetwork(network) === snapshot.selectedNetworkLabel ? 'active' : `${contracts.length}`;
    networkItem.iconPath = new vscode.ThemeIcon('globe');
    networkItem.children = (['espace', 'core'] as const)
      .map((target) => {
        const targetContracts = contracts.filter((contract) => contract.target === target);
        if (!targetContracts.length) return undefined;
        const targetItem = new vscode.TreeItem(
          target === 'core' ? 'Core Space' : 'eSpace',
          vscode.TreeItemCollapsibleState.Expanded,
        ) as vscode.TreeItem & { children?: vscode.TreeItem[] };
        targetItem.description = `${targetContracts.length}`;
        targetItem.iconPath = new vscode.ThemeIcon(target === 'core' ? 'symbol-key' : 'globe');
        targetItem.children = targetContracts.map(makeContractItem);
        return targetItem;
      })
      .filter((item): item is vscode.TreeItem => item !== undefined);
    return networkItem;
  });
}

function makeAddressItem(
  label: string,
  address: string,
  icon: string,
  balance?: string,
): vscode.TreeItem {
  const item = new vscode.TreeItem(label);
  item.description = balance ? `${shorten(address)} | ${balance}` : shorten(address);
  item.tooltip = `${address}${balance ? `\nBalance: ${balance}` : ''}\nClick to copy`;
  item.command = {
    command: 'cfxdevkit.copyAddress',
    title: 'Copy Address',
    arguments: [address],
  };
  item.contextValue = 'cfxAddressItem';
  item.iconPath = new vscode.ThemeIcon(icon);
  return item;
}

function makeContractItem(contract: ContractTreeRecord): vscode.TreeItem {
  const item = new vscode.TreeItem(
    contract.label,
    vscode.TreeItemCollapsibleState.Collapsed,
  ) as vscode.TreeItem & { children?: vscode.TreeItem[] };
  item.description = contract.description;
  item.tooltip = `${contract.address}${contract.detail ? `\n${contract.detail}` : ''}`;
  item.contextValue = 'cfxContractItem';
  item.iconPath = new vscode.ThemeIcon('symbol-class');
  item.children = [makeContractAddressItem(contract), ...makeAbiItems(contract)];
  return item;
}

function makeContractAddressItem(contract: ContractTreeRecord): vscode.TreeItem {
  const item = new vscode.TreeItem('Address');
  item.description = shorten(contract.address);
  item.tooltip = `${contract.address}\nClick to copy`;
  item.command = {
    command: 'cfxdevkit.copyContractAddress',
    title: 'Copy Contract Address',
    arguments: [contract.address],
  };
  item.contextValue = 'cfxAddressItem';
  item.iconPath = new vscode.ThemeIcon('copy');
  return item;
}

function makeAbiItems(contract: ContractTreeRecord): vscode.TreeItem[] {
  const functions = (contract.abi ?? []).filter(isAbiFunction);
  const readFns = functions.filter(isReadFunction);
  const writeFns = functions.filter((fn) => !isReadFunction(fn));
  return [
    readFns.length ? makeAbiGroup('READ', readFns, contract) : undefined,
    writeFns.length ? makeAbiGroup('WRITE', writeFns, contract) : undefined,
  ].filter((item): item is vscode.TreeItem => item !== undefined);
}

function makeAbiGroup(
  label: 'READ' | 'WRITE',
  functions: AbiFunctionTreeRecord[],
  contract: ContractTreeRecord,
): vscode.TreeItem {
  const item = new vscode.TreeItem(
    label,
    vscode.TreeItemCollapsibleState.Expanded,
  ) as vscode.TreeItem & {
    children?: vscode.TreeItem[];
  };
  item.description = `${functions.length}`;
  item.iconPath = new vscode.ThemeIcon(label === 'READ' ? 'eye' : 'edit');
  item.children = functions.map((fn) => makeAbiFunctionItem(label, fn, contract));
  return item;
}

function makeAbiFunctionItem(
  group: 'READ' | 'WRITE',
  fn: AbiFunctionTreeRecord,
  contract: ContractTreeRecord,
): vscode.TreeItem {
  const signature = `${fn.name}(${(fn.inputs ?? [])
    .map((input) => `${input.type} ${input.name ?? ''}`.trim())
    .join(', ')})`;
  const item = new vscode.TreeItem(fn.name);
  item.description = signature.slice(fn.name.length);
  item.tooltip = `${signature}\n${fn.stateMutability ?? 'nonpayable'}`;
  item.command = {
    command: group === 'READ' ? 'cfxdevkit.abiCallRead' : 'cfxdevkit.abiCallWrite',
    title: group === 'READ' ? 'Call Read Function' : 'Call Write Function',
    arguments: [fn, contract],
  };
  item.contextValue = group === 'READ' ? 'cfxAbiRead' : 'cfxAbiWrite';
  item.iconPath = new vscode.ThemeIcon(group === 'READ' ? 'symbol-property' : 'symbol-event');
  return item;
}

function isAbiFunction(entry: unknown): entry is AbiFunctionTreeRecord {
  if (!entry || typeof entry !== 'object') return false;
  const candidate = entry as AbiFunctionTreeRecord;
  return candidate.type === 'function' && typeof candidate.name === 'string';
}

function isReadFunction(fn: AbiFunctionTreeRecord): boolean {
  return fn.stateMutability === 'view' || fn.stateMutability === 'pure';
}

function labelNetwork(network: string): string {
  if (network === 'local') return 'Local';
  if (network === 'testnet') return 'Testnet';
  if (network === 'mainnet') return 'Mainnet';
  return network;
}

function shorten(value: string): string {
  return value.length > 24 ? `${value.slice(0, 12)}...${value.slice(-6)}` : value;
}
