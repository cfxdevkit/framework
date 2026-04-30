export type GroupId = 'devnode' | 'auth' | 'build' | 'interact' | 'inspect';

export interface PanelMeta {
  id: string;
  group: GroupId;
  label: string;
  blurb: string;
}

export const GROUPS: { id: GroupId; label: string }[] = [
  { id: 'devnode', label: 'DevNode' },
  { id: 'auth', label: 'Auth' },
  { id: 'build', label: 'Build' },
  { id: 'interact', label: 'Interact' },
  { id: 'inspect', label: 'Inspect' },
];

export const PANELS: readonly PanelMeta[] = [
  {
    id: 'devnode',
    group: 'devnode',
    label: 'DevNode Control',
    blurb:
      'Start, stop, restart, wipe and mine blocks on the local Conflux devnode. View genesis accounts and copy private keys.',
  },
  {
    id: 'siwe',
    group: 'auth',
    label: 'Sign-In With Ethereum',
    blurb:
      'Authenticate to the backend using SIWE (EIP-4361). Browser wallet signs the challenge; the backend issues a JWT.',
  },
  {
    id: 'session-key',
    group: 'auth',
    label: 'Session Key Delegation',
    blurb:
      'Issue a server-side session key for a parent address with fine-grained capability constraints. Verify the attestation.',
  },
  {
    id: 'compiler',
    group: 'build',
    label: 'Solidity Compiler',
    blurb:
      'Compile Solidity templates via the backend solc pipeline. Edit sources in-browser and deploy via your connected wallet.',
  },
  {
    id: 'contracts',
    group: 'interact',
    label: 'Contract Interaction',
    blurb:
      'ABI-driven read / write console. Paste an address + ABI and call any function with your connected browser wallet.',
  },
  {
    id: 'status',
    group: 'inspect',
    label: 'Network Status',
    blurb:
      'Live RPC health for Core + eSpace on the active network. Shows block numbers, chain IDs and backend reachability.',
  },
  {
    id: 'about',
    group: 'inspect',
    label: 'About',
    blurb: 'What this showcase demonstrates and how the pieces fit together.',
  },
];
