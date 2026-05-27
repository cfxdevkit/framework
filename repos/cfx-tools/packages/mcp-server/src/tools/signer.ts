import type { McpToolDefinition } from './types.js';

export const SIGNER_TOOL_DEFINITIONS: McpToolDefinition[] = [
  {
    name: 'cfxdevkit_signer_status',
    group: 'signer',
    title: 'Signer Status',
    description:
      'Show the active signer configuration from .cfxdevkit/signer.json and resolve addresses when possible.',
    mutability: 'read',
    requiresConfirmation: false,
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
    packageHints: ['@cfxdevkit/signer-session'],
  },
  {
    name: 'cfxdevkit_signer_setup',
    group: 'signer',
    title: 'Configure Signer',
    description:
      'Write a signer entry to .cfxdevkit/signer.json. Supports memory, file-keystore, onekey, and ledger backends.',
    mutability: 'admin',
    requiresConfirmation: true,
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Label for this signer entry (e.g. "dev-wallet")' },
        kind: {
          type: 'string',
          enum: ['memory', 'file-keystore', 'onekey', 'ledger'],
          description: 'Backend kind',
        },
        path: { type: 'string', description: '(file-keystore) Keystore file path' },
        service: { type: 'string', description: '(file-keystore) ref.service namespace' },
        account: { type: 'string', description: '(file-keystore) ref.account name' },
        accountIndex: { type: 'number', description: '(file-keystore) HD account index' },
        setAsDefault: {
          type: 'boolean',
          description: 'Set this as the defaultSigner after writing',
        },
      },
      required: ['name', 'kind'],
    },
    packageHints: ['@cfxdevkit/signer-session'],
  },
  {
    name: 'cfxdevkit_signer_use',
    group: 'signer',
    title: 'Switch Active Signer',
    description: 'Change the defaultSigner in .cfxdevkit/signer.json.',
    mutability: 'admin',
    requiresConfirmation: true,
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Signer name to activate' },
      },
      required: ['name'],
    },
    packageHints: ['@cfxdevkit/signer-session'],
  },
];
