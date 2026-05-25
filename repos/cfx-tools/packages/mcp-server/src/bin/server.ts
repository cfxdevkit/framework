#!/usr/bin/env node
/**
 * @cfxdevkit/mcp-server — CLI entry point.
 *
 * Run via npx:
 *   npx -y @cfxdevkit/mcp-server
 *
 * Or configure in .mcp.json / claude_desktop_config.json:
 *   { "command": "npx", "args": ["-y", "@cfxdevkit/mcp-server"] }
 */
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { detectProjectContext } from '../context/loader.js';
import { assertControlPlaneReachable } from '../control-plane.js';
import { createMcpServer } from '../server.js';

async function main(): Promise<void> {
  await assertControlPlaneReachable();
  const context = detectProjectContext(process.cwd());
  const server = createMcpServer(context);
  const transport = new StdioServerTransport();
  await server.connect(transport);

  const projectInfo = context.projectName ? ` (project: ${context.projectName})` : '';
  process.stderr.write(`@cfxdevkit/mcp-server started${projectInfo}\n`);
}

main().catch((err) => {
  const message = err instanceof Error ? err.message : String(err);
  process.stderr.write(`Fatal: ${message}\n`);
  process.exit(1);
});
