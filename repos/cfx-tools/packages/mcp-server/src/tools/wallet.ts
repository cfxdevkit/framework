import { defineTool } from './types.js';

export const walletTools = [
  defineTool({
    name: 'cfxdevkit_wallet_generate_mnemonic',
    group: 'wallet-utils',
    title: 'Generate mnemonic',
    description: 'Generate a BIP-39 mnemonic through @cfxdevkit/core.',
    mutability: 'read',
    requiresConfirmation: false,
    packageHints: ['@cfxdevkit/core'],
    inputSchema: { type: 'object', properties: { strength: { type: 'number' } } },
  }),
  defineTool({
    name: 'cfxdevkit_wallet_validate_mnemonic',
    group: 'wallet-utils',
    title: 'Validate mnemonic',
    description: 'Validate a BIP-39 mnemonic phrase.',
    mutability: 'read',
    requiresConfirmation: false,
    packageHints: ['@cfxdevkit/core'],
    inputSchema: {
      type: 'object',
      required: ['mnemonic'],
      properties: { mnemonic: { type: 'string' } },
    },
  }),
  defineTool({
    name: 'cfxdevkit_wallet_derive_accounts',
    group: 'wallet-utils',
    title: 'Derive accounts',
    description: 'Derive eSpace/Core account pairs without persisting secrets.',
    mutability: 'read',
    requiresConfirmation: false,
    packageHints: ['@cfxdevkit/core'],
    inputSchema: { type: 'object', additionalProperties: true },
  }),
  defineTool({
    name: 'cfxdevkit_wallet_sign_message',
    group: 'wallet-utils',
    title: 'Sign message',
    description: 'Sign a message through a managed signer; raw private keys are not accepted.',
    mutability: 'write',
    requiresConfirmation: true,
    packageHints: ['@cfxdevkit/services', '@cfxdevkit/wallet'],
    inputSchema: {
      type: 'object',
      required: ['message'],
      properties: { message: { type: 'string' } },
    },
  }),
] as const;
