import type { TreeNodeData, WorkspaceTreeProps } from './workspace-tree.js';
import {
  addAccountNodes,
  addActionNodes,
  addContractNodes,
  addWalletNodes,
} from './workspace-tree-sections';

export function buildTreeModel(props: WorkspaceTreeProps): {
  childrenById: Map<string, string[]>;
  expandedItems: string[];
  nodesById: Map<string, TreeNodeData>;
} {
  const nodesById = new Map<string, TreeNodeData>();
  const childrenById = new Map<string, string[]>();
  const expandedItems = ['wallets', 'accounts', 'contracts', 'actions'];

  const addNode = (node: TreeNodeData, parentId = 'root') => {
    nodesById.set(node.id, node);
    const siblings = childrenById.get(parentId) ?? [];
    siblings.push(node.id);
    childrenById.set(parentId, siblings);
    if (!childrenById.has(node.id)) {
      childrenById.set(node.id, []);
    }
  };

  nodesById.set('root', { id: 'root', label: 'root' });
  childrenById.set('root', []);
  addWalletNodes(props, addNode);
  addAccountNodes(props, addNode);
  addContractNodes(props, addNode, expandedItems);
  addActionNodes(props, addNode);

  return { childrenById, expandedItems, nodesById };
}

export function handleNodeAction(node: TreeNodeData, props: WorkspaceTreeProps) {
  if (!node.action) {
    return;
  }

  if (node.action.type === 'space') {
    props.onSetSpace(node.action.space);
    props.onSelectSection('contract-context');
    return;
  }

  if (node.action.type === 'contract') {
    props.onSelectContract(node.action.contractId);
    props.onSelectSection('contract-context');
    return;
  }

  props.onSelectSection(node.action.section);
}

export function resolveActiveNodeId(props: WorkspaceTreeProps): string {
  if (props.activeSection === 'contract-context' && props.selectedContractId) {
    return `contract:${props.selectedContractId}`;
  }
  if (props.activeSection === 'deploy') {
    return 'contracts:deploy';
  }
  if (props.activeSection === 'compiler') {
    return 'actions:compiler';
  }
  if (props.activeSection === 'session-key') {
    return 'actions:session-key';
  }
  if (props.activeSection === 'custom-operation') {
    return 'actions:custom';
  }
  if (props.activeSection === 'accounts' && props.activeWallet) {
    return `account:${props.activeWallet.id}:${props.activeWallet.activeAccountIndex}`;
  }
  if (props.activeSection === 'keystore' && props.activeWallet) {
    return `wallet:${props.activeWallet.id}`;
  }
  if (props.activeSection === 'devnode') {
    return 'actions:devnode';
  }
  return props.activeSection;
}
