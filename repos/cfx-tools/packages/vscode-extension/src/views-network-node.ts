import * as vscode from 'vscode';
import type { ViewSnapshot } from './views-model.js';

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
