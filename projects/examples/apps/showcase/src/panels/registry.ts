import { type ComponentType, lazy } from 'react';

export type PanelGroup = 'backend' | 'onchain' | 'keys' | 'auth' | 'contracts' | 'inspect';

export interface PanelSpec {
  id: string;
  group: PanelGroup;
  label: string;
  /** One-liner shown under the panel title. */
  blurb: string;
  component: ComponentType;
}

export interface PanelGroupSpec {
  id: PanelGroup;
  label: string;
}

export const GROUPS: readonly PanelGroupSpec[] = Object.freeze([
  { id: 'backend', label: 'Backend SDK' },
  { id: 'onchain', label: 'On-Chain' },
  { id: 'keys', label: 'Key Tools' },
  { id: 'auth', label: 'Auth & Signing' },
  { id: 'contracts', label: 'Contracts' },
  { id: 'inspect', label: 'Inspect' },
]);

const lazyDefault = <K extends string>(loader: () => Promise<Record<K, ComponentType>>, key: K) =>
  lazy(() => loader().then((m) => ({ default: m[key] })));

export const PANELS: readonly PanelSpec[] = Object.freeze([
  // ── Backend SDK ──────────────────────────────────────────────────
  {
    id: 'core',
    group: 'backend',
    label: 'Core RPC',
    blurb:
      'Core Space client: address codec, unit helpers, RPC methods, block/tx lookups, and the cross-space bridge — all bound to the active network.',
    component: lazyDefault(() => import('./CorePanel.js'), 'CorePanel'),
  },
  {
    id: 'compiler',
    group: 'onchain',
    label: 'Compiler',
    blurb:
      'Compile a Solidity template server-side via the backend solc pipeline, inspect the ABI and bytecode, then deploy to Core or eSpace with a managed key.',
    component: lazyDefault(() => import('./CompilerPanel.js'), 'CompilerPanel'),
  },
  {
    id: 'contract-interaction',
    group: 'contracts',
    label: 'Contract Interaction',
    blurb:
      'ABI-driven read / write console. Reuse session deployments or paste an address + ABI to call any function on Core or eSpace.',
    component: lazyDefault(
      () => import('./ContractInteractionPanel.js'),
      'ContractInteractionPanel',
    ),
  },
  // ── Key Tools ────────────────────────────────────────────────────
  {
    id: 'mnemonic',
    group: 'keys',
    label: 'BIP-39 Mnemonic',
    blurb:
      'Generate entropy-backed BIP-39 phrases (12–24 words) and validate any existing phrase against the English wordlist checksum.',
    component: lazyDefault(() => import('./MnemonicPanel.js'), 'MnemonicPanel'),
  },
  {
    id: 'derive',
    group: 'keys',
    label: 'HD Derivation',
    blurb:
      'Call deriveDualAccounts() to produce EVM + Core base32 address pairs from any BIP-39 phrase. Supports standard and mining derivation paths.',
    component: lazyDefault(() => import('./DerivePanel.js'), 'DerivePanel'),
  },
  {
    id: 'wallet',
    group: 'keys',
    label: 'Managed Wallet',
    blurb:
      'Manage the backend keystore session: choose the active mnemonic, derive accounts, connect a signer. The connected account is shared across Core and eSpace panels.',
    component: lazyDefault(() => import('./WalletPanel.js'), 'WalletPanel'),
  },
  {
    id: 'keystore',
    group: 'keys',
    label: 'Keystore Session',
    blurb:
      'Inspect the active keystore backend (memory / file), list managed roots, sign a test message, and exercise capability-scoped signing.',
    component: lazyDefault(() => import('./KeystorePanel.js'), 'KeystorePanel'),
  },
  // ── Auth & Signing ───────────────────────────────────────────────
  {
    id: 'session-key',
    group: 'auth',
    label: 'Session Key',
    blurb:
      'Issue a sub-key with fine-grained capability constraints (chain, contract, selector, value, TTL) and verify the server-signed attestation.',
    component: lazyDefault(() => import('./SessionKeyPanel.js'), 'SessionKeyPanel'),
  },
  {
    id: 'siwe',
    group: 'auth',
    label: 'Sign-In With Ethereum',
    blurb:
      'Full SIWE round-trip: fetch a nonce, sign the EIP-4361 message with the active managed key, verify with the backend, and call /auth/me.',
    component: lazyDefault(() => import('./SiwePanel.js'), 'SiwePanel'),
  },
  // ── Inspect ──────────────────────────────────────────────────────
  {
    id: 'status',
    group: 'inspect',
    label: 'Network Status',
    blurb: 'Ping every chain in listChains() in parallel and surface block numbers and chain IDs.',
    component: lazyDefault(() => import('./StatusPanel.js'), 'StatusPanel'),
  },
  {
    id: 'about',
    group: 'inspect',
    label: 'About',
    blurb: 'What this showcase covers and how the SDK packages fit together.',
    component: lazyDefault(() => import('./AboutPanel.js'), 'AboutPanel'),
  },
]);

export function getPanel(id: string): PanelSpec | undefined {
  return PANELS.find((p) => p.id === id);
}

export function panelsByGroup(group: PanelGroup): PanelSpec[] {
  return PANELS.filter((p) => p.group === group);
}
