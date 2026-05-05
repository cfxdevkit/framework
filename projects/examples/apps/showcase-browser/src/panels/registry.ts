import { type ComponentType, lazy } from 'react';

export type PanelGroup = 'keys' | 'connect' | 'use' | 'dual' | 'utility';

export interface PanelSpec {
  id: string;
  group: PanelGroup;
  label: string;
  blurb: string;
  /** Stack the panel demonstrates — surfaced as a small badge. */
  stack: 'wagmi' | 'use-wallet-react' | 'window' | 'core';
  component: ComponentType;
}

export interface PanelGroupSpec {
  id: PanelGroup;
  label: string;
}

export const GROUPS: readonly PanelGroupSpec[] = Object.freeze([
  { id: 'keys', label: 'Keys' },
  { id: 'connect', label: 'Connect' },
  { id: 'use', label: 'Use' },
  { id: 'dual', label: 'Dual space' },
  { id: 'utility', label: 'Utility' },
]);

const lazyDefault = <K extends string>(loader: () => Promise<Record<K, ComponentType>>, key: K) =>
  lazy(() => loader().then((m) => ({ default: m[key] })));

export const PANELS: readonly PanelSpec[] = Object.freeze([
  // ---------- Keys ----------
  {
    id: 'mnemonic',
    group: 'keys',
    label: 'Mnemonic',
    stack: 'core',
    blurb: 'Generate and validate BIP-39 mnemonics in the browser using the platform CSPRNG.',
    component: lazyDefault(() => import('./MnemonicPanel.js'), 'MnemonicPanel'),
  },
  {
    id: 'derive',
    group: 'keys',
    label: 'Derive',
    stack: 'core',
    blurb: 'Walk BIP-32/SLIP-0044 paths and inspect dual-space eSpace + Core addresses.',
    component: lazyDefault(() => import('./DerivePanel.js'), 'DerivePanel'),
  },

  // ---------- Connect ----------
  {
    id: 'wallets',
    group: 'connect',
    label: 'Wallets',
    stack: 'use-wallet-react',
    blurb:
      'Connect non-Fluent wagmi eSpace, Fluent Core, raw Fluent eSpace, and MetaMask in one view.',
    component: lazyDefault(() => import('./WalletConnectPanel.js'), 'WalletConnectPanel'),
  },

  // ---------- Use ----------
  {
    id: 'account',
    group: 'use',
    label: 'Account',
    stack: 'use-wallet-react',
    blurb: 'eSpace and Core account dashboards: address, balance, block/epoch, gas.',
    component: lazyDefault(() => import('./UnifiedAccountPanel.js'), 'UnifiedAccountPanel'),
  },
  {
    id: 'sign',
    group: 'use',
    label: 'Sign message',
    stack: 'use-wallet-react',
    blurb: 'personal_sign + typed data on eSpace (EIP-712) and Core (CIP-23).',
    component: lazyDefault(() => import('./UnifiedSignPanel.js'), 'UnifiedSignPanel'),
  },
  {
    id: 'send',
    group: 'use',
    label: 'Send transaction',
    stack: 'use-wallet-react',
    blurb: 'Send CFX on eSpace (wagmi) and Core (cfx_sendTransaction) from one panel.',
    component: lazyDefault(() => import('./UnifiedSendPanel.js'), 'UnifiedSendPanel'),
  },

  // ---------- Dual space ----------
  {
    id: 'dual-space',
    group: 'dual',
    label: 'Dual space',
    stack: 'use-wallet-react',
    blurb: "Core + eSpace simultaneously via Fluent's two providers.",
    component: lazyDefault(() => import('./DualSpacePanel.js'), 'DualSpacePanel'),
  },

  // ---------- Utility ----------
  {
    id: 'address-units',
    group: 'utility',
    label: 'Address & units',
    stack: 'core',
    blurb: 'CIP-37 base32 ↔ hex, CFX/drip/Gdrip math.',
    component: lazyDefault(() => import('./AddressUnitsPanel.js'), 'AddressUnitsPanel'),
  },
  {
    id: 'status',
    group: 'utility',
    label: 'Network status',
    stack: 'core',
    blurb: 'Ping every public chain in listChains() in parallel.',
    component: lazyDefault(() => import('./StatusPanel.js'), 'StatusPanel'),
  },
  {
    id: 'about',
    group: 'utility',
    label: 'About',
    stack: 'core',
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
