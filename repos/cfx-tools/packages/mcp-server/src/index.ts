// Public surface for @cfxdevkit/mcp-server.
export const __packageName = '@cfxdevkit/mcp-server' as const;

export type { ProjectContext } from './context/types.js';
export * from './operations.js';
export { createMcpServer } from './server.js';
export * from './tools/registry.js';
export * from './tools/types.js';
