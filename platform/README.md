# platform/  — Tier 1: Developer Platform

Everything that improves the developer experience of building on the framework.
Not a runtime dependency of deployed applications.

## Components

| Folder | Scope | Source today |
|--------|-------|--------------|
| [devcontainer/](devcontainer/) | Reproducible Docker dev environment | `devkit-workspace/.devcontainer` |
| [mcp-server/](mcp-server/) | MCP server exposing chain tools to AI agents | `devkit-workspace/packages/mcp-server` |
| [scaffold-cli/](scaffold-cli/) | `create-conflux-app` style project generator | `devkit-workspace/packages/scaffold-cli` |
| [vscode-extension/](vscode-extension/) | Status bar, tree views, commands | `devkit-workspace/packages/vscode-extension` |
| [templates/](templates/) | Starter templates consumed by scaffold-cli | `devkit-workspace/templates` |
| [devtools/](devtools/) | Internal CLI server, embedded UI, contract sandbox | `devkit/devtools` |
| [docs-site/](docs-site/) | Public docs site (built from `docs/`) | `devkit/docs` (existing static) |

## Rules

- May depend on `framework/*` via npm range (not workspace `*`) so platform releases independently.
- Must not import from `domains/` or `projects/`.
- Public-facing tools (CLI, MCP) honor semver.
