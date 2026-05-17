import type * as vscode from 'vscode';

export interface AccountTreeRecord {
  label: string;
  description?: string;
  walletRef?: TreeSecretRef;
  accountIndex?: number;
  espaceAddress?: string;
  coreAddress?: string;
  espaceBalance?: string;
  coreBalance?: string;
  detail?: string;
  state?: 'ready' | 'locked' | 'unavailable';
}

export interface WalletRootRecord {
  label: string;
  ref: TreeSecretRef;
  description?: string;
  detail?: string;
  active: boolean;
  state: 'ready' | 'locked' | 'unavailable';
}

export interface TreeSecretRef {
  service: string;
  account: string;
}

export interface WalletTreeItem extends vscode.TreeItem {
  walletRef?: TreeSecretRef;
  accountIndex?: number;
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
  selectedNetwork: 'local' | 'testnet' | 'mainnet';
  selectedNetworkLabel: string;
  selectedSpaceLabel: string;
  keystoreLocked: boolean;
  nodeRunning: boolean;
  walletRoots: ReadonlyArray<WalletRootRecord>;
  networkOptions: ReadonlyArray<NetworkTreeRecord>;
  nodeStatusLabel: string;
  nodeActions: ReadonlyArray<{ label: string; command: string; detail?: string }>;
  accounts: ReadonlyArray<AccountTreeRecord>;
  contracts: ReadonlyArray<ContractTreeRecord>;
}
