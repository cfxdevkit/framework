import * as vscode from 'vscode';
import type { ViewSnapshot } from '../model.js';

export function makeNetworkNodeRow(snapshot: ViewSnapshot): vscode.TreeItem {
  const selected = snapshot.networkOptions.find((option) => option.selected);
  const isLocal = snapshot.selectedNetwork === 'local';

  const item = new vscode.TreeItem(snapshot.selectedNetworkLabel);

  if (isLocal) {
    if (snapshot.keystoreLocked) {
      item.description = 'unlock wallet to control node';
      item.tooltip =
        'Local network selected. Unlock your wallet to start or control the local node.';
      item.iconPath = new vscode.ThemeIcon('lock', new vscode.ThemeColor('descriptionForeground'));
      item.contextValue = 'cfxLocalNodeLocked';
    } else if (snapshot.nodeRunning) {
      item.description = 'node running';
      item.tooltip = 'Local Conflux dev node is running. Click to switch network.';
      item.iconPath = new vscode.ThemeIcon(
        'server-environment',
        new vscode.ThemeColor('testing.iconPassed'),
      );
      item.contextValue = 'cfxLocalNodeRunning';
    } else {
      item.description = 'node stopped';
      item.tooltip = 'Local Conflux dev node is stopped. Click to switch network.';
      item.iconPath = new vscode.ThemeIcon(
        'server',
        new vscode.ThemeColor('descriptionForeground'),
      );
      item.contextValue = 'cfxLocalNodeStopped';
    }
  } else {
    item.description = selected?.description ?? 'Core + eSpace';
    item.tooltip = selected
      ? `${selected.label}\n${selected.description}\nCore chainId ${selected.coreChainId}; eSpace chainId ${selected.espaceChainId}`
      : 'Select the active Conflux network';
    item.iconPath = new vscode.ThemeIcon(
      snapshot.selectedNetwork === 'testnet' ? 'beaker' : 'globe',
      new vscode.ThemeColor('testing.iconPassed'),
    );
    item.contextValue = 'cfxNonLocalNetwork';
  }

  item.command = {
    command: 'cfxdevkit.selectNetwork',
    title: 'Select Network',
  };
  return item;
}

export function makeNetworkItems(snapshot: ViewSnapshot): vscode.TreeItem[] {
  return [makeNetworkNodeRow(snapshot)];
}

export function makeNodeItems(snapshot: ViewSnapshot): vscode.TreeItem[] {
  return [makeNetworkNodeRow(snapshot)];
}
