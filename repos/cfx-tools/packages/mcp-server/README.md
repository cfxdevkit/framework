# @cfxdevkit/mcp-server

**Scope:** Model Context Protocol server bridging AI agents to Conflux chain operations.

**Responsibilities**
- Expose framework capabilities as MCP tools (read, simulate, deploy, swap, …)
- Enforce a strict tool allowlist
- Require user confirmation for any write operation
- Never accept a raw private key; session keys only

The implementation direction is shared-backend alignment: MCP tools should target the same local-runtime control plane used by `showcase-local` and the VS Code extension. The preferred model is one orchestrated backend whose state can be fetched consistently by extension, MCP, showcase, and user-driven tooling.

In practice this means:

- the tool registry defines the command surface MCP needs
- runtime handlers should bind those commands to the shared backend contract
- HTTP via `@cfxdevkit/client` is the default reusable integration path
- a matching in-process adapter is acceptable only if it preserves the same command semantics and shared state model

That shared backend contract now includes a few important runtime guarantees:

- keystore terminology stays shared: wallet roots are mnemonic roots, and accounts are derived child indexes beneath the active wallet root
- network profile is wallet-scoped and backend-owned
- `local` versus `public` mode is derived from the active backend profile, not from MCP-side tool state
- public deploy and write flows resolve signers with the same precedence used by `showcase-local` and the VS Code extension
- tracked contracts persist per wallet and can be addressed directly through `POST /contracts/:id/call` in addition to generic ABI read and write routes

Reset and recovery follow the same shared rule as `showcase-local` and the VS Code extension: destructive reset is operator-only. MCP tools may surface backend status and guidance, but they must not implement a passwordless reset mutation; operators stop the runtime and remove the configured keystore file plus its matching `.runtime` directory when a blank-state reset is required.

> **Note:** This package lives under `repos/cfx-tools/packages/mcp-server` but aligns with the Tier 1 platform surface in the five-tier architecture. See [ARCHITECTURE.md](../../../../ARCHITECTURE.md) for tier definitions.

## Install

```bash
npm install @cfxdevkit/mcp-server
```

## Sub-paths

| Sub-path | Exports |
|----------|---------|
| `.` | 16 symbols |

---

## `.`

```ts
export declare const __packageName: "@cfxdevkit/mcp-server";
export declare const MCP_TOOL_DEFINITIONS: McpToolDefinition[];
export { ProjectContext }
export { createMcpServer }
export type OperationStatus = 'running' | 'succeeded' | 'failed';
export type McpToolName = (typeof MCP_TOOL_DEFINITIONS)[number]['name'];
export type McpToolGroup = 'node' | 'accounts' | 'blockchain-read' | 'blockchain-write' | 'compiler' | 'keystore' | 'wallet-utils' | 'scaffold';
export type McpToolMutability = 'read' | 'write' | 'admin';
export interface OperationStep {
  id: string;
  name: string;
  status: OperationStatus;
  timestamp: number;
}
export interface OperationRecord {
  id: string;
  toolName: McpToolName;
  inputs: Record<string, unknown>;
  steps: OperationStep[];
  status: OperationStatus;
  createdAt: number;
  updatedAt: number;
}
export interface OperationLedgerOptions {
  basePath?: string;
}
export interface McpToolDefinition {
  name: McpToolName;
  group: McpToolGroup;
  mutability: McpToolMutability;
  description: string;
  parameters: Record<string, unknown>;
}
export declare class OperationLedger {
  constructor(options?: OperationLedgerOptions);
  record(operation: OperationRecord): void;
  get(id: string): OperationRecord | undefined;
  list(): OperationRecord[];
  clear(): void;
}
export declare function listMcpTools(group?: McpToolGroup): readonly McpToolDefinition[];
export declare function getMcpTool(name: string): McpToolDefinition | undefined;
export declare function defineTool(definition: McpToolDefinition): McpToolDefinition;
```

## Usage

```typescript
import { createMcpServer, listMcpTools } from '@cfxdevkit/mcp-server';

// List available tools in a specific group
const readTools = listMcpTools('blockchain-read');
console.log('Available read tools:', readTools.map(t => t.name));

// Create and start an MCP server instance
const server = createMcpServer({
  // Optional: configure ledger storage path
  ledger: { basePath: './.mcp-ledger' }
});

// Start listening for MCP requests
await server.start();
console.log('MCP server started');
```

## API Reference

See [API.md](./API.md) for the full public surface.

## Tier

**Tier 1 — platform** — May import Tier 0 framework packages.

<!-- readme-hash: 8726154f7da1c5d299d459e0d1959312f4e8a66dd0b8d83c7da9646177ccf4c3 -->
