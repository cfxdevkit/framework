# `@cfxdevkit/mcp-server` — API Reference

> Direct-package MCP tool scaffold. Runtime handlers will call `@cfxdevkit/*` packages directly rather than proxying through a shared backend server.

## Public Exports

```ts
const __packageName: '@cfxdevkit/mcp-server'

type McpToolGroup =
  | 'node'
  | 'accounts'
  | 'blockchain-read'
  | 'blockchain-write'
  | 'compiler'
  | 'keystore'
  | 'wallet-utils'

type McpToolMutability = 'read' | 'write' | 'admin'

interface McpToolDefinition
const MCP_TOOL_DEFINITIONS: readonly McpToolDefinition[]
type McpToolName = (typeof MCP_TOOL_DEFINITIONS)[number]['name']

function listMcpTools(group?: McpToolGroup): readonly McpToolDefinition[]
function getMcpTool(name: string): McpToolDefinition | undefined

class OperationLedger
```

## Tool Surface

The registry currently declares 33 tools across node, accounts, blockchain read/write, compiler, keystore, and wallet utility groups. Each definition records its mutability, confirmation requirement, source packages, and JSON-schema input shape.

Runtime handlers are intentionally not implemented yet; the registry is the contract that the handler layer will attach to.

## Operation Ledger

```ts
const ledger = new OperationLedger();
const operation = ledger.startOperation('cfxdevkit_compiler_compile_solidity', { files: 1 });
ledger.addOperationStep(operation.id, 'compiled');
ledger.finishOperation(operation.id, 'succeeded');
```

The ledger is in-memory by design. Project-level backends can persist operation records separately if they need durable audit history.

## Internal Workspace Dependencies

```json
{
  "@cfxdevkit/compiler": "workspace:^",
  "@cfxdevkit/contracts": "workspace:^",
  "@cfxdevkit/core": "workspace:^",
  "@cfxdevkit/devnode": "workspace:^",
  "@cfxdevkit/protocol": "workspace:^",
  "@cfxdevkit/services": "workspace:^",
  "@cfxdevkit/wallet": "workspace:^"
}
```

## Tier

Defined per [ARCHITECTURE.md](../../../ARCHITECTURE.md). Dependencies must respect the one-way rule: `projects → domains → platform → framework`.
