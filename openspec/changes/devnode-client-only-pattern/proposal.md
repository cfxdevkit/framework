## Why

`mcp-server` and `vscode-extension` both embed `devnode-server` in-process using
`createDevnodeServerApp`. This couples two unrelated concerns:

1. **Process embedding** — the server app (Hono HTTP server + devnode lifecycle + keystore +
   wallet + contracts) runs inside the same process as the editor/MCP layer.
2. **All-or-nothing dep graph** — both consumers must take the full 7-package `devnode-server`
   dep tree (`cdk + devnode + compiler + contracts + keystore-server + services + wallet`)
   even when they only need node-control via `client`.

The `@cfxdevkit/client` package already exists precisely for this boundary: it is a typed HTTP
client for the `devnode-server` control plane. Both consumers already use it — but fall back
to in-process embedding when `CFXDEVKIT_DEVNODE_SERVER_URL` is not set.

Embedding was a convenience shortcut during early development. Now that the devnode-server
is a stable, independently launchable service (started by `tooling-cli` / the VS Code
extension's process manager), the in-process fallback is dead weight that inflates the
dependency graph and prevents clean separation.

## What Changes

- Remove `createDevnodeServerApp` usage from `mcp-server` (`control-plane.ts`) and
  `vscode-extension` (`helpers/shared.ts`).
- Both always connect to an external `devnode-server` via `ConfluxDevkitClient`. The base URL
  comes from `CFXDEVKIT_DEVNODE_SERVER_URL` or a well-known default.
- `devnode-server` is removed from `mcp-server` and `vscode-extension` `package.json`
  `dependencies`.
- A **devnode-server launcher** helper is added to `tooling-cli` (or the extension's existing
  process manager is confirmed as the canonical start path) so there is always a clear,
  documented way to start the server before connecting.

Additionally, split `devnode-server` into two packages for consumers with different needs:

| Package | Contents | Consumers |
|---|---|---|
| `devnode-core` | devnode + compiler + contracts + cdk + HTTP server skeleton | future lightweight consumers |
| `devnode-server` (renamed to `devnode-full`) | devnode-core + keystore-server + services + wallet | extension process manager |

## Capabilities

### New Capabilities
- `devnode-external-connect`: `mcp-server` and `vscode-extension` connect to an external
  devnode-server URL; no in-process server code.

### Modified Capabilities
- `devnode-server-split`: `devnode-server` package split into `devnode-core` and
  `devnode-full`; existing consumers updated to the appropriate package.

## Impact

- `repos/cfx-tools/packages/mcp-server/src/control-plane.ts` — remove `createDevnodeServerApp`
- `repos/cfx-tools/packages/mcp-server/package.json` — remove `@cfxdevkit/devnode-server`
- `repos/cfx-tools/packages/vscode-extension/src/helpers/shared.ts` — remove `createDevnodeServerApp`
- `repos/cfx-tools/packages/vscode-extension/package.json` — remove `@cfxdevkit/devnode-server`
- `repos/cfx-tools/packages/devnode-server/` — split into `devnode-core` + `devnode-full`
- `repos/cfx-tools/infra/tooling-cli/` — add/confirm devnode-server launch command
