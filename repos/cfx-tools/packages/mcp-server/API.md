# `@cfxdevkit/mcp-server` — Public API

> MCP server exposing devkit tools to AI agents.

## Sub-paths

| Sub-path | Exports |
|----------|---------|
| `.` | 16 symbols |

---

## `.`

### Usage

```typescript
import { createMcpServer, listMcpTools } from '@cfxdevkit/mcp-server';

const server = createMcpServer({
  // Configuration options
});

const tools = listMcpTools('blockchain-read');
console.log(tools);
```

```ts
// The name of the package.
export declare const __packageName: "@cfxdevkit/mcp-server";
// The collection of all available MCP tool definitions.
export declare const MCP_TOOL_DEFINITIONS: McpToolDefinition[];
// Contextual information for project-related operations.
export { ProjectContext }
// Creates a new Model Context Protocol server instance.
export declare function createMcpServer(options?: { /* ... */ }): Server;
// The current state of an operation.
export type OperationStatus = 'running' | 'succeeded' | 'failed';
// The name of an available MCP tool.
export type McpToolName = (typeof MCP_TOOL_DEFINITIONS)[number]['name'];
// Categories used to group MCP tools.
export type McpToolGroup = 'node' | 'accounts' | 'blockchain-read' | 'blockchain-write' | 'compiler' | 'keystore' | 'wallet-utils' | 'scaffold';
// The level of access or impact a tool has.
export type McpToolMutability = 'read' | 'write' | 'admin';
// Details of an individual step within an operation.
export interface OperationStep {
  // A human-readable description of the step.
  description: string;
  // Timestamp when the step started.
  startTime: number;
  // Timestamp when the step ended (or null if still running).
  endTime?: number;
  // Status of the step.
  status: OperationStatus;
}
// A log entry for a completed or ongoing operation.
export interface OperationRecord {
  // Unique identifier for the operation.
  id: string;
  // Name of the tool invoked.
  toolName: McpToolName;
  // Timestamp when the operation started.
  startTime: number;
  // Final status of the operation.
  status: OperationStatus;
  // List of steps executed during the operation.
  steps: OperationStep[];
  // Optional metadata associated with the operation.
  metadata?: Record<string, unknown>;
}
// Configuration settings for the operation ledger.
export interface OperationLedgerOptions {
  // Path to the ledger file (optional; defaults to in-memory only).
  filePath?: string;
  // Whether to auto-flush changes to disk.
  autoFlush?: boolean;
}
// Metadata and schema for an MCP tool.
export interface McpToolDefinition {
  // Unique name of the tool.
  name: McpToolName;
  // Human-readable description of what the tool does.
  description: string;
  // Group this tool belongs to.
  group: McpToolGroup;
  // Mutability level: read, write, or admin.
  mutability: McpToolMutability;
  // JSON Schema describing the tool's input parameters.
  inputSchema: Record<string, unknown>;
}
// A system for tracking and auditing operations.
export declare class OperationLedger {
  // Constructs a new ledger instance.
  constructor(options?: OperationLedgerOptions);
  // Records a new operation.
  record(operation: OperationRecord): void;
  // Retrieves all recorded operations.
  getAll(): readonly OperationRecord[];
  // Retrieves operations filtered by tool name.
  getByToolName(toolName: McpToolName): readonly OperationRecord[];
  // Retrieves operations filtered by status.
  getByStatus(status: OperationStatus): readonly OperationRecord[];
  // Persists current state to disk (if filePath is configured).
  flush(): void;
}
// Retrieves a list of tools, optionally filtered by group.
export declare function listMcpTools(group?: McpToolGroup): readonly McpToolDefinition[];
// Retrieves a specific tool definition by its name.
export declare function getMcpTool(name: string): McpToolDefinition | undefined;
// Registers or validates a tool definition.
export declare function defineTool(definition: McpToolDefinition): McpToolDefinition;
```

<!-- api-hash: 0555b43748229992791c27e6fcd5e2d9f35f89b5834694874bb086229b090262 -->
