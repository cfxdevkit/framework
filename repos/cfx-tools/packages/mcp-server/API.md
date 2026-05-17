# `@cfxdevkit/mcp-server` — API Reference

> MCP tool scaffold aligned to the shared local-runtime control plane. Runtime handlers should target the same backend contract used by showcase-local and the VS Code extension.

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

Runtime handlers are intentionally not fully implemented yet; the registry is the contract that the handler layer will attach to.

## Planned Runtime Integration

MCP should align to the shared local-runtime backend contract rather than own an independent lifecycle model.

```text
MCP tools
  └─ MCP handler layer
      └─ shared local-runtime contract
          ├─ HTTP via @cfxdevkit/client
          └─ or a matching in-process adapter
```

The goal is one orchestrated runtime state model that can be fetched consistently by showcase-local, the VS Code extension, MCP, and user-driven tooling.

The current shared backend contract expects MCP consumers to model these
surfaces explicitly:

- `GET /network/current`, `GET /network/capabilities`, `GET /network/config`,
  `POST /network/config`, and `POST /network/set` for wallet-scoped local/public
  profile management
- `POST /deploy/run` for local or public deploys, with deploy responses that
  may include `contractId`, `mode`, and public signer provenance
- `GET /contracts`, `GET /contracts/:id`, `POST /contracts/register`,
  `POST /contracts/read`, `POST /contracts/write`, and
  `POST /contracts/:id/call` for generic and tracked contract operations

If MCP exposes these flows through tool handlers, the tool contract should not
re-implement its own notion of active network, tracked contract storage, or
signer precedence.

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
  "@cfxdevkit/client": "workspace:^",
  "@cfxdevkit/compiler": "workspace:^",
  "@cfxdevkit/contracts": "workspace:^",
  "@cfxdevkit/core": "workspace:^",
  "@cfxdevkit/devnode-server": "workspace:^",
  "@cfxdevkit/protocol": "workspace:^",
  "@cfxdevkit/services": "workspace:^",
  "@cfxdevkit/wallet": "workspace:^"
}
```

Runtime tools consume the shared backend contract through `@cfxdevkit/client`. The MCP server may embed `@cfxdevkit/devnode-server` for local operation, but handlers should not own a separate package-local devnode lifecycle.

## Tier

Defined per [ARCHITECTURE.md](../../../ARCHITECTURE.md). Dependencies must respect the one-way rule: `projects → domains → platform → framework`.
