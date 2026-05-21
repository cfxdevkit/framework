import { defineTool } from './types.js';

export const blockchainReadTools = [
  'espace_balance',
  'core_balance',
  'espace_block',
  'core_epoch',
  'call_contract_espace',
  'call_contract_core',
  'read_erc20',
  'get_receipt',
].map((suffix) =>
  defineTool({
    name: `cfxdevkit_blockchain_${suffix}`,
    group: 'blockchain-read',
    title: suffix.replaceAll('_', ' '),
    description: `Read blockchain data with direct @cfxdevkit/cdk and @cfxdevkit/contracts calls: ${suffix}.`,
    mutability: 'read',
    requiresConfirmation: false,
    packageHints: ['@cfxdevkit/cdk', '@cfxdevkit/contracts', '@cfxdevkit/protocol'],
    inputSchema: { type: 'object', additionalProperties: true },
  }),
);

export const blockchainWriteTools = [
  'send_cfx_espace',
  'send_cfx_core',
  'write_contract',
  'deploy_contract',
  'erc20_transfer',
  'erc20_approve',
].map((suffix) =>
  defineTool({
    name: `cfxdevkit_blockchain_${suffix}`,
    group: 'blockchain-write',
    title: suffix.replaceAll('_', ' '),
    description: `Submit blockchain writes with direct package calls and explicit confirmation: ${suffix}.`,
    mutability: 'write',
    requiresConfirmation: true,
    packageHints: ['@cfxdevkit/cdk', '@cfxdevkit/contracts', '@cfxdevkit/wallet'],
    inputSchema: { type: 'object', additionalProperties: true },
  }),
);
