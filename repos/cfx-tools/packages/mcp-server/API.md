# `@cfxdevkit/mcp-server` — Public API

> MCP server exposing devkit tools to AI agents.

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
export interface OperationRecord {
export interface OperationLedgerOptions {
export interface McpToolDefinition {
export declare class OperationLedger {
export declare function listMcpTools(group?: McpToolGroup): readonly McpToolDefinition[];
export declare function getMcpTool(name: string): McpToolDefinition | undefined;
export declare function defineTool(definition: McpToolDefinition): McpToolDefinition;
```

<!-- api-hash: 0555b43748229992791c27e6fcd5e2d9f35f89b5834694874bb086229b090262 -->
