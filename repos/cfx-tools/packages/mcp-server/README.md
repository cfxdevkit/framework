# platform/mcp-server

**Scope:** Model Context Protocol server bridging AI agents to Conflux chain operations.

**Responsibilities**
- Expose framework capabilities as MCP tools (read, simulate, deploy, swap, …)
- Enforce a strict tool allowlist
- Require user confirmation for any write operation
- Never accept a raw private key; session keys only

The new implementation direction is direct-package wiring: MCP tools import and call reusable tier-0 packages (`@cfxdevkit/core`, `@cfxdevkit/contracts`, `@cfxdevkit/compiler`, `@cfxdevkit/devnode`, `@cfxdevkit/services`, `@cfxdevkit/wallet`) instead of proxying through a shared backend HTTP service.

The current package exposes a typed tool registry plus an operation ledger scaffold. Runtime handlers will attach to those definitions in the next implementation pass.

> **Note:** This package lives under `repos/cfx-tools/packages/mcp-server` but aligns with the `platform/` tier in the five-tier architecture. See [ARCHITECTURE.md](../../../../../docs/architecture/ARCHITECTURE.md) for tier definitions.
