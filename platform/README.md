# platform/ — moved

This tier has been carved into the `repos/` layout per
[ADR-0003](../docs/adr/0003-multi-repo-split.md).

| Old path | New path |
|----------|----------|
| `platform/scaffold-cli` | `repos/cfx-tools/packages/scaffold-cli` |
| `platform/mcp-server` | `repos/cfx-tools/packages/mcp-server` |
| `platform/vscode-extension` | `repos/cfx-tools/packages/vscode-extension` |
| `platform/devcontainer` | `repos/cfx-tools/packages/devcontainer` |
| `platform/devtools` | `repos/cfx-tools/devtools` |
| `platform/templates` | `repos/cfx-tools/templates` |
| `platform/docs-site` | `repos/cfx-tools/packages/docs-site` |

This directory is kept only so historical links resolve. New tooling
goes into `repos/cfx-tools/`.
