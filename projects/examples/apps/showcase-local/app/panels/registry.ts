export type LocalPanelGroup = 'backend' | 'onchain' | 'keys' | 'auth' | 'contracts' | 'inspect';

export type LocalPanelId =
  | 'setup'
  | 'keystore'
  | 'accounts'
  | 'devnode'
  | 'session-key'
  | 'compiler'
  | 'deploy'
  | 'contract-context'
  | 'custom-operation'
  | 'reveal';

export interface LocalPanelSpec {
  id: LocalPanelId;
  group: LocalPanelGroup;
  label: string;
  blurb: string;
  localOnly?: boolean;
}

export const PANELS: readonly LocalPanelSpec[] = Object.freeze([
  {
    id: 'setup',
    group: 'backend',
    label: 'Environment',
    blurb:
      'Backend-owned network profile, chain ids, write path, and help links for local, testnet, and mainnet.',
  },
  {
    id: 'devnode',
    group: 'backend',
    label: 'Local Devnode',
    blurb:
      'Select the backend node profile, start or restart the local runtime, mine blocks, and inspect funded genesis accounts.',
    localOnly: true,
  },
  {
    id: 'compiler',
    group: 'onchain',
    label: 'Compiler',
    blurb:
      'Compile Solidity through the framework backend, inspect the active artifact, then hand it off to deploy.',
  },
  {
    id: 'deploy',
    group: 'onchain',
    label: 'Deploy',
    blurb:
      'Deploy the compiled artifact to Core or eSpace on the active backend network profile with the managed signer.',
  },
  {
    id: 'keystore',
    group: 'keys',
    label: 'Wallets',
    blurb:
      'Manage the backend keystore, generate or import mnemonic wallets, and choose the active signer.',
  },
  {
    id: 'accounts',
    group: 'keys',
    label: 'Accounts',
    blurb:
      'Activate derived accounts, inspect paired Core and eSpace addresses, and use the local faucet against either address family.',
  },
  {
    id: 'session-key',
    group: 'auth',
    label: 'Session Key',
    blurb:
      'Issue and verify delegated signer scopes with chain, contract, selector, and TTL constraints from the backend signer.',
  },
  {
    id: 'contract-context',
    group: 'contracts',
    label: 'Contract Context',
    blurb:
      'Browse the tracked contract registry for the active network and family, inspect ABI functions, and load targets into later flows.',
  },
  {
    id: 'custom-operation',
    group: 'inspect',
    label: 'Custom Backend Action',
    blurb:
      'Exercise the showcase-specific backend extension hook using the active network and selected family.',
  },
  {
    id: 'reveal',
    group: 'auth',
    label: 'Secret Reveal',
    blurb:
      'Two-step flow to reveal a wallet mnemonic or account private key through the backend keystore using a one-time token.',
  },
]);

export function visiblePanels(network: 'local' | 'mainnet' | 'testnet'): LocalPanelSpec[] {
  return PANELS.filter((panel) => (panel.localOnly ? network === 'local' : true));
}

export function getPanel(
  id: string,
  network: 'local' | 'mainnet' | 'testnet',
): LocalPanelSpec | null {
  return visiblePanels(network).find((panel) => panel.id === id) ?? null;
}
