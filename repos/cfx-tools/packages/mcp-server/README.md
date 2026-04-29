# platform/mcp-server

**Scope:** Model Context Protocol server bridging AI agents to Conflux chain operations.

**Responsibilities**
- Expose framework capabilities as MCP tools (read, simulate, deploy, swap, …)
- Enforce a strict tool allowlist
- Require user confirmation for any write operation
- Never accept a raw private key; session keys only

Depends on: `framework/core`, `framework/wallet`, `framework/compiler`, `framework/services`.
