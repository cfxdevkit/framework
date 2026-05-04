import * as vscode from 'vscode';

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

export function makeSection(
  label: string,
  icon: string,
  children: vscode.TreeItem[],
): vscode.TreeItem {
  const item = new vscode.TreeItem(
    label,
    vscode.TreeItemCollapsibleState.Expanded,
  ) as vscode.TreeItem & {
    children?: vscode.TreeItem[];
  };
  item.iconPath = new vscode.ThemeIcon(icon);
  item.children = children;
  return item;
}

export function makeCommandItem(
  label: string,
  description: string | undefined,
  command: string,
  icon: string,
  tooltip?: string,
): vscode.TreeItem {
  const item = new vscode.TreeItem(label);
  item.description = description;
  item.tooltip = tooltip;
  item.iconPath = new vscode.ThemeIcon(icon);
  item.command = { command, title: label };
  return item;
}

export function makeAddressItem(
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

export function shorten(value: string): string {
  return value.length > 24 ? `${value.slice(0, 12)}...${value.slice(-6)}` : value;
}
