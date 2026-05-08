import { accountTools } from './accounts.js';
import { blockchainReadTools, blockchainWriteTools } from './blockchain.js';
import { compilerTools } from './compiler.js';
import { keystoreTools } from './keystore.js';
import { nodeTools } from './node.js';
import type { McpToolDefinition, McpToolGroup } from './types.js';
import { walletTools } from './wallet.js';

export const MCP_TOOL_DEFINITIONS = [
  ...nodeTools,
  ...accountTools,
  ...blockchainReadTools,
  ...blockchainWriteTools,
  ...compilerTools,
  ...keystoreTools,
  ...walletTools,
] satisfies readonly McpToolDefinition[];

export type McpToolName = (typeof MCP_TOOL_DEFINITIONS)[number]['name'];

export function listMcpTools(group?: McpToolGroup): readonly McpToolDefinition[] {
  if (!group) return MCP_TOOL_DEFINITIONS;
  return MCP_TOOL_DEFINITIONS.filter((tool) => tool.group === group);
}

export function getMcpTool(name: string): McpToolDefinition | undefined {
  return MCP_TOOL_DEFINITIONS.find((tool) => tool.name === name);
}
