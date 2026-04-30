import { type ComponentType, lazy } from 'react';
import type { Space } from '../contexts/NetworkProvider.js';

export type PanelGroup = 'identity' | 'auth' | 'onchain' | 'inspect';

export interface PanelSpec {
  id: string;
  group: PanelGroup;
  label: string;
  /** Which Conflux spaces the panel exercises. Empty = network-agnostic. */
  spaces: readonly Space[];
  /** One-liner shown under the panel title. */
  blurb: string;
  component: ComponentType;
}

export interface PanelGroupSpec {
  id: PanelGroup;
  label: string;
}

export const GROUPS: readonly PanelGroupSpec[] = Object.freeze([
  { id: 'identity', label: 'Identity' },
  { id: 'auth', label: 'Auth' },
  { id: 'onchain', label: 'On-chain' },
  { id: 'inspect', label: 'Inspect' },
]);

const lazyDefault = <K extends string>(loader: () => Promise<Record<K, ComponentType>>, key: K) =>
  lazy(() => loader().then((m) => ({ default: m[key] })));

export const PANELS: readonly PanelSpec[] = Object.freeze([
  {
    id: 'mnemonic',
    group: 'identity',
    label: 'Mnemonic',
    spaces: [],
    blurb: 'Generate / validate BIP-39 mnemonics.',
    component: lazyDefault(() => import('./MnemonicPanel.js'), 'MnemonicPanel'),
  },
  {
    id: 'derive',
    group: 'identity',
    label: 'Derive',
    spaces: ['core', 'espace'],
    blurb: 'Walk BIP-32/SLIP-0044 paths and inspect dual-space addresses.',
    component: lazyDefault(() => import('./DerivePanel.js'), 'DerivePanel'),
  },
  {
    id: 'keystore',
    group: 'identity',
    label: 'Keystore',
    spaces: [],
    blurb: 'Encrypt / decrypt EIP-2335 JSON keystores.',
    component: lazyDefault(() => import('./KeystorePanel.js'), 'KeystorePanel'),
  },
  {
    id: 'wallet',
    group: 'identity',
    label: 'Wallet',
    spaces: ['core', 'espace'],
    blurb: 'In-memory signer derived from the active mnemonic.',
    component: lazyDefault(() => import('./WalletPanel.js'), 'WalletPanel'),
  },
  {
    id: 'siwe',
    group: 'auth',
    label: 'SIWE',
    spaces: ['espace'],
    blurb: 'Sign-In With Ethereum end-to-end (frontend + showcase-backend).',
    component: lazyDefault(() => import('./SiwePanel.js'), 'SiwePanel'),
  },
  {
    id: 'session-key',
    group: 'auth',
    label: 'Session Key',
    spaces: ['espace'],
    blurb: 'Issue + verify scoped session-key delegations.',
    component: lazyDefault(() => import('./SessionKeyPanel.js'), 'SessionKeyPanel'),
  },
  {
    id: 'core',
    group: 'onchain',
    label: 'Core RPC',
    spaces: ['core'],
    blurb: 'Core Space client surface, address codecs, bridge.',
    component: lazyDefault(() => import('./CorePanel.js'), 'CorePanel'),
  },
  {
    id: 'contract-interaction',
    group: 'onchain',
    label: 'Contract interaction',
    spaces: ['core', 'espace'],
    blurb:
      'Generic ABI read/write console — mirrors the VS Code extension contract tree (cfxdevkit.abiCallRead / abiCallWrite).',
    component: lazyDefault(
      () => import('./ContractInteractionPanel.js'),
      'ContractInteractionPanel',
    ),
  },
  {
    id: 'compiler',
    group: 'onchain',
    label: 'Compiler',
    spaces: ['core', 'espace'],
    blurb: 'Compile a curated Solidity template (server-side) and deploy it.',
    component: lazyDefault(() => import('./CompilerPanel.js'), 'CompilerPanel'),
  },
  {
    id: 'status',
    group: 'inspect',
    label: 'Network status',
    spaces: ['core', 'espace'],
    blurb: 'Ping every chain in listChains() in parallel.',
    component: lazyDefault(() => import('./StatusPanel.js'), 'StatusPanel'),
  },
  {
    id: 'about',
    group: 'inspect',
    label: 'About',
    spaces: [],
    blurb: 'What this showcase covers.',
    component: lazyDefault(() => import('./AboutPanel.js'), 'AboutPanel'),
  },
]);

export function getPanel(id: string): PanelSpec | undefined {
  return PANELS.find((p) => p.id === id);
}

export function panelsByGroup(group: PanelGroup): PanelSpec[] {
  return PANELS.filter((p) => p.group === group);
}
