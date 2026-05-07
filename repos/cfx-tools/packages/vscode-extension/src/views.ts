export { makeAccountItems } from './views-accounts.js';
export { makeSection, StaticTreeProvider } from './views-common.js';
export { makeContractItems } from './views-contracts.js';
export type {
  AbiFunctionTreeRecord,
  AccountTreeRecord,
  ContractTreeRecord,
  NetworkTreeRecord,
  TreeSecretRef,
  ViewSnapshot,
  WalletRootRecord,
  WalletTreeItem,
} from './views-model.js';
export {
  makeNetworkItems,
  makeNetworkNodeRow,
  makeNetworkRow,
  makeNodeItems,
  makeNodeRow,
} from './views-network-node.js';

import type * as vscode from 'vscode';
import { makeAccountItems } from './views-accounts.js';
import { makeSection } from './views-common.js';
import { makeContractItems } from './views-contracts.js';
import type { ViewSnapshot } from './views-model.js';
import { makeNetworkNodeRow } from './views-network-node.js';

export function makeMainItems(snapshot: ViewSnapshot): vscode.TreeItem[] {
  return [
    makeNetworkNodeRow(snapshot),
    ...makeAccountItems(snapshot),
    makeSection('Contracts', 'file-code', makeContractItems(snapshot)),
  ];
}
