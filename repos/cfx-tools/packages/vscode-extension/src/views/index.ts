export { makeAccountItems } from './accounts.js';
export { makeSection, StaticTreeProvider } from './common.js';
export { makeContractItems } from './contracts.js';
export type {
  AbiFunctionTreeRecord,
  AccountTreeRecord,
  ContractTreeRecord,
  NetworkTreeRecord,
  TreeSecretRef,
  ViewSnapshot,
  WalletRootRecord,
  WalletTreeItem,
} from './model.js';
export {
  makeNetworkItems,
  makeNetworkNodeRow,
  makeNetworkRow,
  makeNodeItems,
  makeNodeRow,
} from './network/node.js';

import type * as vscode from 'vscode';
import { makeAccountItems } from './accounts.js';
import { makeSection } from './common.js';
import { makeContractItems } from './contracts.js';
import type { ViewSnapshot } from './model.js';
import { makeNetworkNodeRow } from './network/node.js';

export function makeMainItems(snapshot: ViewSnapshot): vscode.TreeItem[] {
  return [
    makeNetworkNodeRow(snapshot),
    ...makeAccountItems(snapshot),
    makeSection('Contracts', 'file-code', makeContractItems(snapshot)),
  ];
}
