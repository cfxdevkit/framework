import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import type { ProjectContext } from './context/types.js';
import { stopControlPlaneNode } from './control-plane.js';
import { handleAccountsTool } from './handlers/accounts.js';
import { handleBlockchainTool } from './handlers/blockchain.js';
import { handleCompilerTool } from './handlers/compiler.js';
import { handleKeystoreTool } from './handlers/keystore.js';
import { handleNodeTool } from './handlers/node.js';
import { handleScaffoldTool } from './handlers/scaffold.js';
import { handleSignerTool } from './handlers/signer.js';
import { handleWalletTool } from './handlers/wallet.js';
import { registerAllResources } from './resources/registry.js';
import { MCP_TOOL_DEFINITIONS } from './tools/registry.js';

/** Convert our tool definition inputSchema to MCP-compatible JSON Schema. */
function toMcpTool(def: (typeof MCP_TOOL_DEFINITIONS)[number]) {
  return {
    name: def.name,
    description: def.description,
    inputSchema: def.inputSchema,
  };
}

/**
 * Build and wire an MCP {@link Server} instance.
 * Registers all 37 tools and 8 resource endpoints.
 * Call `server.connect(transport)` after this to start serving.
 */
export function createMcpServer(context: ProjectContext): Server {
  const server = new Server(
    { name: '@cfxdevkit/mcp-server', version: '0.0.0' },
    { capabilities: { tools: {}, resources: {} } },
  );

  // ── Tool list ─────────────────────────────────────────────────────────────
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: MCP_TOOL_DEFINITIONS.map(toMcpTool),
  }));

  // ── Tool dispatch ─────────────────────────────────────────────────────────
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args = {} } = request.params;

    try {
      if (name.startsWith('cfxdevkit_node_')) {
        return await handleNodeTool(name, args as Record<string, unknown>);
      }
      if (name.startsWith('cfxdevkit_account')) {
        return await handleAccountsTool(name, args as Record<string, unknown>);
      }
      if (name.startsWith('cfxdevkit_keystore_')) {
        return await handleKeystoreTool(name, args as Record<string, unknown>);
      }
      if (name.startsWith('cfxdevkit_blockchain_')) {
        return await handleBlockchainTool(name, args as Record<string, unknown>);
      }
      if (name.startsWith('cfxdevkit_compiler_')) {
        return await handleCompilerTool(name, args as Record<string, unknown>);
      }
      if (name.startsWith('cfxdevkit_wallet_')) {
        return await handleWalletTool(name, args as Record<string, unknown>);
      }
      if (name.startsWith('cfxdevkit_signer_')) {
        return await handleSignerTool(name, args as Record<string, unknown>);
      }
      if (name.startsWith('cfxdevkit_scaffold_')) {
        return await handleScaffoldTool(name, args as Record<string, unknown>);
      }

      return {
        isError: true,
        content: [{ type: 'text', text: `Unknown tool: ${name}` }],
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        isError: true,
        content: [{ type: 'text', text: `Unhandled error in ${name}: ${message}` }],
      };
    }
  });

  // ── Resources ─────────────────────────────────────────────────────────────
  registerAllResources(server, context);

  // ── Cleanup on process exit ───────────────────────────────────────────────
  const cleanup = async () => {
    process.stderr.write('MCP server shutting down — stopping devnode-server control plane...\n');
    await stopControlPlaneNode();
    process.exit(0);
  };
  process.once('SIGINT', cleanup);
  process.once('SIGTERM', cleanup);

  return server;
}
