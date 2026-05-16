import type { NetworkId, SpaceId, TreeNodeData, WorkspaceTreeProps } from './index.js';

type AddTreeNode = (node: TreeNodeData, parentId?: string) => void;

export function addWalletNodes(props: WorkspaceTreeProps, addNode: AddTreeNode) {
  addNode(
    {
      id: 'wallets',
      label: 'Wallets',
      meta: props.activeWallet
        ? `${props.activeWallet.name} · ${displayNetwork(props.network)}`
        : `locked or not initialized · ${displayNetwork(props.network)}`,
      section: 'keystore',
      action: { type: 'section', section: 'keystore' },
    },
    'root',
  );
  addNode(
    {
      id: 'wallets:add',
      label: '+ Add wallet',
      meta: 'create or import mnemonic root',
      section: 'keystore',
      action: { type: 'section', section: 'keystore' },
    },
    'wallets',
  );
  addNode(
    {
      id: 'wallets:unlock',
      label: props.keystoreReady ? 'Wallet ready' : 'Unlock wallet tree',
      meta: props.keystoreReady
        ? 'signer available for backend actions'
        : 'unlock, import, or activate a wallet root',
      section: 'keystore',
      action: { type: 'section', section: 'keystore' },
    },
    'wallets',
  );
  for (const wallet of props.wallets) {
    addNode(
      {
        id: `wallet:${wallet.id}`,
        label: wallet.name,
        meta: `#${wallet.activeAccountIndex} · ${wallet.accountCount} accounts${wallet.active ? ' · active' : ''}`,
        section: 'keystore',
        action: { type: 'section', section: 'keystore' },
      },
      'wallets',
    );
  }
}

export function addAccountNodes(props: WorkspaceTreeProps, addNode: AddTreeNode) {
  addNode(
    {
      id: 'accounts',
      label: 'Accounts',
      meta: props.activeWallet
        ? `${props.activeWallet.name} · active #${props.activeWallet.activeAccountIndex}`
        : 'unlock wallet tree first',
      section: 'accounts',
      action: { type: 'section', section: 'accounts' },
    },
    'root',
  );
  if (!props.activeWallet) {
    addNode(
      {
        id: 'accounts:locked',
        label: 'Accounts unavailable',
        meta: 'unlock the keystore and activate a wallet root first',
        section: 'accounts',
        action: { type: 'section', section: 'accounts' },
      },
      'accounts',
    );
    return;
  }
  for (const account of props.walletAccounts) {
    addNode(
      {
        id: `account:${props.activeWallet.id}:${account.index}`,
        label: `${props.activeWallet.name} #${account.index}`,
        meta: `${shortAddress(account.address)} / ${shortAddress(account.coreAddress)}${account.active ? ' · active' : ''}`,
        section: 'accounts',
        action: { type: 'section', section: 'accounts' },
      },
      'accounts',
    );
  }
  if (props.walletAccounts.length === 0) {
    addNode(
      {
        id: 'accounts:empty',
        label: props.accountsBusy === 'refresh' ? 'Loading accounts' : 'No derived accounts loaded',
        meta: 'open the accounts pane for details',
        section: 'accounts',
        action: { type: 'section', section: 'accounts' },
      },
      'accounts',
    );
  }
}

export function addContractNodes(
  props: WorkspaceTreeProps,
  addNode: AddTreeNode,
  expandedItems: string[],
) {
  addNode(
    {
      id: 'contracts',
      label: 'Contracts',
      meta: `${props.contracts.length} tracked · ${displayNetwork(props.network)}`,
      section: 'contract-context',
      action: { type: 'section', section: 'contract-context' },
    },
    'root',
  );
  addNode(
    {
      id: 'contracts:deploy',
      label: 'Deploy contract',
      meta: props.localWriteBlocked ? 'start local node before deploy' : 'open deploy pane',
      section: 'deploy',
      action: { type: 'section', section: 'deploy' },
    },
    'contracts',
  );
  for (const space of ['espace', 'core'] as const) {
    const spaceId = `contracts:space:${space}`;
    const activeSpace = space === props.space;
    addNode(
      {
        id: spaceId,
        label: space === 'espace' ? 'eSpace' : 'Core',
        meta: activeSpace
          ? `${props.contracts.length} tracked · chain ${chainIdFor(props.network, space)}`
          : `switch family · chain ${chainIdFor(props.network, space)}`,
        section: 'contract-context',
        action: { type: 'space', space },
      },
      'contracts',
    );
    if (!activeSpace) {
      continue;
    }
    expandedItems.push(spaceId);
    if (props.contracts.length === 0) {
      addNode(
        {
          id: `contracts:empty:${space}`,
          label: 'No tracked contracts',
          meta: 'deploy or switch family',
          section: 'contract-context',
          action: { type: 'section', section: 'contract-context' },
        },
        spaceId,
      );
    }
    for (const contract of props.contracts) {
      addNode(
        {
          id: `contract:${contract.id}`,
          label: contract.name,
          meta: `${shortAddress(contract.address)} · ${contract.chainId}`,
          section: 'contract-context',
          action: { type: 'contract', contractId: contract.id },
        },
        spaceId,
      );
    }
  }
}

export function addActionNodes(props: WorkspaceTreeProps, addNode: AddTreeNode) {
  addNode(
    {
      id: 'actions',
      label: 'Actions',
      meta:
        props.network === 'local'
          ? 'local node, compiler, session key, custom route'
          : 'compiler, session key, custom route',
      section: 'compiler',
      action: { type: 'section', section: 'compiler' },
    },
    'root',
  );
  if (props.network === 'local') {
    addNode(
      {
        id: 'actions:devnode',
        label: 'Local node',
        meta: props.devnodeRunning
          ? `running${props.selectedNodeProfileName ? ` · ${props.selectedNodeProfileName}` : ''}`
          : 'start, stop, restart, mine',
        section: 'devnode',
        action: { type: 'section', section: 'devnode' },
      },
      'actions',
    );
  }
  addNode(
    {
      id: 'actions:compiler',
      label: 'Compiler',
      meta: 'compile Solidity in the backend',
      section: 'compiler',
      action: { type: 'section', section: 'compiler' },
    },
    'actions',
  );
  addNode(
    {
      id: 'actions:session-key',
      label: 'Session key',
      meta: 'issue and verify delegated signer scopes',
      section: 'session-key',
      action: { type: 'section', section: 'session-key' },
    },
    'actions',
  );
  addNode(
    {
      id: 'actions:custom',
      label: 'Custom route',
      meta: 'read the current block number through the extension hook',
      section: 'custom-operation',
      action: { type: 'section', section: 'custom-operation' },
    },
    'actions',
  );
}

function displayNetwork(network: NetworkId): string {
  if (network === 'local') {
    return 'Local';
  }
  if (network === 'testnet') {
    return 'Testnet';
  }
  return 'Mainnet';
}

function chainIdFor(network: NetworkId, space: SpaceId): number {
  if (network === 'local') {
    return space === 'core' ? 2029 : 2030;
  }
  if (network === 'testnet') {
    return space === 'core' ? 1 : 71;
  }
  return space === 'core' ? 1029 : 1030;
}

function shortAddress(value: string | undefined): string {
  if (!value) {
    return 'n/a';
  }
  if (value.length <= 16) {
    return value;
  }
  return `${value.slice(0, 8)}...${value.slice(-6)}`;
}
