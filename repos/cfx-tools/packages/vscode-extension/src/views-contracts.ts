import * as vscode from 'vscode';
import { shorten } from './views-common.js';
import type { AbiFunctionTreeRecord, ContractTreeRecord, ViewSnapshot } from './views-model.js';

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
