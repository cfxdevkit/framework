export type McpToolGroup =
  | 'node'
  | 'accounts'
  | 'blockchain-read'
  | 'blockchain-write'
  | 'compiler'
  | 'keystore'
  | 'wallet-utils';

export type McpToolMutability = 'read' | 'write' | 'admin';

export interface McpToolDefinition {
  name: string;
  group: McpToolGroup;
  title: string;
  description: string;
  mutability: McpToolMutability;
  requiresConfirmation: boolean;
  packageHints: readonly string[];
  inputSchema: Record<string, unknown>;
}

export function defineTool(definition: McpToolDefinition): McpToolDefinition {
  return definition;
}
