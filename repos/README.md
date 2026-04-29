# repos/

Tier-aligned repository slices, per [ADR-0003](../docs/adr/0003-multi-repo-split.md).

Each subdirectory is **structured as if it were already a standalone git
repository**: it has its own `package.json`, `pnpm-workspace.yaml`, and
`README.md`. While we still live in the `root/` monorepo, the top-level
`pnpm-workspace.yaml` globs `repos/*/packages/*` so day-to-day development
keeps working as a single workspace.

When a slice is ready to be carved out:

1. `git filter-repo --subdirectory-filter repos/<name>` in a fresh clone.
2. Push to its new remote (e.g. `cfx-keys`).
3. Drop its entries from the root `pnpm-workspace.yaml`.
4. Update consumers to depend on published npm versions.

| Slice | Tier | Public surface |
|-------|------|----------------|
| [cfx-meta](./cfx-meta/) | — | architecture, ADRs, release orchestration |
| [cfx-core](./cfx-core/) | 0a | chain primitives (core, protocol, contracts, compiler, executor, devnode, testing) |
| [cfx-keys](./cfx-keys/) | 0b | **audit-grade trust boundary** — keystore + wallet + hardware adapters |
| [cfx-ui](./cfx-ui/) | 0c | React, theme, defi-react, wallet-connect |
| [cfx-domain](./cfx-domain/) | 2 | game-engine, automation, hardware-bridge |
| [cfx-tools](./cfx-tools/) | 1 | scaffold-cli, mcp-server, vscode-extension, devtools, devcontainer |
