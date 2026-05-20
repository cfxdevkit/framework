## Why

The VS Code extension and MCP server both document `@cfxdevkit/devnode-server` plus `@cfxdevkit/client` as the canonical control plane, but the current implementations still own direct `@cfxdevkit/devnode` paths. That split creates two runtime models for the same toolchain and makes the release contract ambiguous.

## What Changes

- Make `@cfxdevkit/devnode-server` the shared runtime contract for the VS Code extension and MCP server.
- Use `@cfxdevkit/client` as the typed consumer surface for both tools.
- Audit and fill any missing backend routes or client methods needed for the full tool and command surface.
- Add smoke coverage and documentation updates so the implementation and docs agree.

## Capabilities

### New Capabilities
- `tooling-shared-control-plane`: defines the shared client-backed runtime contract for the extension and MCP server.

### Modified Capabilities
- None.

## Impact

- Affected code: `repos/cfx-tools/packages/client/`, `repos/cfx-tools/packages/devnode-server/`, `repos/cfx-tools/packages/mcp-server/`, `repos/cfx-tools/packages/vscode-extension/`.
- Affected systems: local runtime ownership, tooling integration semantics, smoke coverage, package documentation.
