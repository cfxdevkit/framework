import { defineTool } from './types.js';

export const scaffoldTools = [
  defineTool({
    name: 'cfxdevkit_scaffold_list_templates',
    group: 'scaffold',
    title: 'List scaffold templates',
    description: 'List available project templates with names and descriptions.',
    mutability: 'read',
    requiresConfirmation: false,
    packageHints: ['@cfxdevkit/create'],
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  }),
  defineTool({
    name: 'cfxdevkit_scaffold_preview_template',
    group: 'scaffold',
    title: 'Preview scaffold template',
    description: 'Show the file tree that a template would generate without writing any files.',
    mutability: 'read',
    requiresConfirmation: false,
    packageHints: ['@cfxdevkit/create'],
    inputSchema: {
      type: 'object',
      required: ['template'],
      properties: {
        template: { type: 'string', description: 'Template name, e.g. "minimal-dapp"' },
      },
    },
  }),
  defineTool({
    name: 'cfxdevkit_scaffold_create_project',
    group: 'scaffold',
    title: 'Create project from template',
    description: 'Scaffold a new cfxdevkit project on disk from a named template.',
    mutability: 'write',
    requiresConfirmation: true,
    packageHints: ['@cfxdevkit/create'],
    inputSchema: {
      type: 'object',
      required: ['template', 'name', 'outputDir'],
      properties: {
        template: { type: 'string' },
        name: { type: 'string' },
        outputDir: { type: 'string', description: 'Absolute or CWD-relative output directory' },
        description: { type: 'string' },
        version: { type: 'string' },
      },
    },
  }),
  defineTool({
    name: 'cfxdevkit_scaffold_add_mcp_config',
    group: 'scaffold',
    title: 'Add MCP config to project',
    description:
      'Write a .mcp.json pointing to @cfxdevkit/mcp-server in an existing project directory.',
    mutability: 'write',
    requiresConfirmation: true,
    packageHints: ['@cfxdevkit/create'],
    inputSchema: {
      type: 'object',
      required: ['outputDir'],
      properties: {
        outputDir: { type: 'string', description: 'Path to the target project directory' },
      },
    },
  }),
] as const;
