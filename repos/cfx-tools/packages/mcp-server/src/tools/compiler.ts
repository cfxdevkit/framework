import { defineTool } from './types.js';

export const compilerTools = [
  defineTool({
    name: 'cfxdevkit_compiler_list_templates',
    group: 'compiler',
    title: 'List Solidity templates',
    description: 'List templates from @cfxdevkit/compiler.',
    mutability: 'read',
    requiresConfirmation: false,
    packageHints: ['@cfxdevkit/compiler'],
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  }),
  defineTool({
    name: 'cfxdevkit_compiler_get_template',
    group: 'compiler',
    title: 'Get Solidity template',
    description: 'Read a template source by ID.',
    mutability: 'read',
    requiresConfirmation: false,
    packageHints: ['@cfxdevkit/compiler'],
    inputSchema: { type: 'object', required: ['id'], properties: { id: { type: 'string' } } },
  }),
  defineTool({
    name: 'cfxdevkit_compiler_compile_solidity',
    group: 'compiler',
    title: 'Compile Solidity',
    description: 'Compile Solidity sources with @cfxdevkit/compiler.',
    mutability: 'read',
    requiresConfirmation: false,
    packageHints: ['@cfxdevkit/compiler'],
    inputSchema: { type: 'object', additionalProperties: true },
  }),
  defineTool({
    name: 'cfxdevkit_compiler_compile_and_deploy',
    group: 'compiler',
    title: 'Compile and deploy Solidity',
    description: 'Compile sources then deploy using @cfxdevkit/contracts.',
    mutability: 'write',
    requiresConfirmation: true,
    packageHints: ['@cfxdevkit/compiler', '@cfxdevkit/contracts', '@cfxdevkit/wallet'],
    inputSchema: { type: 'object', additionalProperties: true },
  }),
] as const;
