# platform/mcp-server

**Scope:** Model Context Protocol server bridging AI agents to Conflux chain operations.

**Responsibilities**
- Expose framework capabilities as MCP tools (read, simulate, deploy, swap, …)
- Enforce a strict tool allowlist
- Require user confirmation for any write operation
- Never accept a raw private key; session keys only

The implementation direction is shared-backend alignment: MCP tools should target the same local-runtime control plane used by showcase-local and the VS Code extension. The preferred model is one orchestrated backend whose state can be fetched consistently by extension, MCP, showcase, and user-driven tooling.

In practice this means:

- the tool registry defines the command surface MCP needs
- runtime handlers should bind those commands to the shared backend contract
- HTTP via `@cfxdevkit/client` is the default reusable integration path
- a matching in-process adapter is acceptable only if it preserves the same command semantics and shared state model

That shared backend contract now includes a few important runtime guarantees:

- network profile is wallet-scoped and backend-owned
- `local` versus `public` mode is derived from the active backend profile,
	not from MCP-side tool state
- public deploy and write flows resolve signers with the same precedence used
	by showcase-local and the VS Code extension
- tracked contracts persist per wallet and can be addressed directly through
	`POST /contracts/:id/call` in addition to generic ABI read and write routes

The current package still exposes a typed tool registry plus an operation ledger scaffold. Runtime handlers and docs need to keep converging on the shared backend contract in the next implementation pass.

> **Note:** This package lives under `repos/cfx-tools/packages/mcp-server` but aligns with the `platform/` tier in the five-tier architecture. See [ARCHITECTURE.md](../../../../../docs/architecture/ARCHITECTURE.md) for tier definitions.
