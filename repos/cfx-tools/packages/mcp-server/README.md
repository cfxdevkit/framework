# platform/mcp-server

**Scope:** Model Context Protocol server bridging AI agents to Conflux chain operations.

**Responsibilities**
- Expose framework capabilities as MCP tools (read, simulate, deploy, swap, …)
- Enforce a strict tool allowlist
- Require user confirmation for any write operation
- Never accept a raw private key; session keys only

Depends on: `framework/core`, `framework/wallet`, `framework/compiler`, `framework/services`.

> **Note:** This package lives under `repos/cfx-tools/packages/mcp-server` but aligns with the `platform/` tier in the five-tier architecture. See [ARCHITECTURE.md](../../../../../docs/architecture/ARCHITECTURE.md) for tier definitions.
