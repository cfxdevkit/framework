import { defineTool } from './types.js';

export const keystoreTools = ['status', 'setup', 'unlock', 'list_wallets'].map((suffix) =>
  defineTool({
    name: `cfxdevkit_keystore_${suffix}`,
    group: 'keystore',
    title: suffix.replaceAll('_', ' '),
    description: `Keystore operation using @cfxdevkit/services: ${suffix}.`,
    mutability: suffix === 'status' || suffix === 'list_wallets' ? 'read' : 'admin',
    requiresConfirmation: suffix !== 'status' && suffix !== 'list_wallets',
    packageHints: ['@cfxdevkit/services', '@cfxdevkit/wallet'],
    inputSchema: { type: 'object', additionalProperties: true },
  }),
);
