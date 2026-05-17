import { defineTool } from './types.js';

export const nodeTools = [
  defineTool({
    name: 'cfxdevkit_node_start',
    group: 'node',
    title: 'Start local Conflux node',
    description: 'Start a local dev node through the shared @cfxdevkit/client control plane.',
    mutability: 'admin',
    requiresConfirmation: true,
    packageHints: ['@cfxdevkit/client', '@cfxdevkit/devnode-server'],
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  }),
  defineTool({
    name: 'cfxdevkit_node_stop',
    group: 'node',
    title: 'Stop local Conflux node',
    description:
      'Stop a running local dev node through the shared @cfxdevkit/client control plane.',
    mutability: 'admin',
    requiresConfirmation: true,
    packageHints: ['@cfxdevkit/client', '@cfxdevkit/devnode-server'],
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  }),
  defineTool({
    name: 'cfxdevkit_node_status',
    group: 'node',
    title: 'Read local Conflux node status',
    description: 'Return node status, RPC URLs, chain IDs, accounts, and mining state.',
    mutability: 'read',
    requiresConfirmation: false,
    packageHints: ['@cfxdevkit/client', '@cfxdevkit/devnode-server'],
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  }),
  defineTool({
    name: 'cfxdevkit_node_mine',
    group: 'node',
    title: 'Mine local blocks',
    description: 'Advance the local node by mining one or more blocks.',
    mutability: 'admin',
    requiresConfirmation: true,
    packageHints: ['@cfxdevkit/client', '@cfxdevkit/devnode-server'],
    inputSchema: { type: 'object', properties: { blocks: { type: 'number', minimum: 1 } } },
  }),
] as const;
