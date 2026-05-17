import { defineTool } from './types.js';

export const accountTools = [
  defineTool({
    name: 'cfxdevkit_accounts_list',
    group: 'accounts',
    title: 'List dev accounts',
    description: 'List local dev node accounts and derived addresses.',
    mutability: 'read',
    requiresConfirmation: false,
    packageHints: ['@cfxdevkit/client', '@cfxdevkit/devnode-server'],
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  }),
  defineTool({
    name: 'cfxdevkit_account_get',
    group: 'accounts',
    title: 'Get dev account',
    description: 'Return one local account by index.',
    mutability: 'read',
    requiresConfirmation: false,
    packageHints: ['@cfxdevkit/client', '@cfxdevkit/devnode-server'],
    inputSchema: { type: 'object', required: ['index'], properties: { index: { type: 'number' } } },
  }),
  defineTool({
    name: 'cfxdevkit_account_fund',
    group: 'accounts',
    title: 'Fund account from faucet',
    description: 'Transfer local CFX from the dev node faucet account.',
    mutability: 'write',
    requiresConfirmation: true,
    packageHints: ['@cfxdevkit/client', '@cfxdevkit/devnode-server'],
    inputSchema: {
      type: 'object',
      required: ['address', 'amountCfx'],
      properties: { address: { type: 'string' }, amountCfx: { type: 'string' } },
    },
  }),
] as const;
