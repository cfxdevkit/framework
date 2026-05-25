## P1 — Split devnode-server into devnode-core and devnode-full

- [x] **P1.1** Create `repos/cfx-tools/packages/devnode-core/` — copy `devnode-server` as base,
  strip keystore-server + services + wallet routes and their deps from `package.json`
- [x] **P1.2** `devnode-core` deps: `@cfxdevkit/cdk`, `@cfxdevkit/devnode`, `@cfxdevkit/compiler`,
  `@cfxdevkit/contracts`, `hono`, `@hono/node-server`
- [x] **P1.3** Create `repos/cfx-tools/packages/devnode-full/` — depends on `devnode-core` +
  `keystore-server + services + wallet`; re-exports `createDevnodeServerApp` with full stack
- [x] **P1.4** Add both new packages to `pnpm-workspace.yaml` under `repos/cfx-tools/packages/*`
- [x] **P1.5** Update `devnode-server` to re-export from `devnode-full` as a compatibility shim
  (or deprecate; decide based on any remaining references)
- [x] **P1.6** Build and typecheck both new packages

## P2 — Remove embedded server from mcp-server

- [x] **P2.1** In `mcp-server/src/control-plane.ts`: remove `createDevnodeServerApp` import and
  the in-process `fetchImpl` / `app` branch
- [x] **P2.2** `createControlPlane()` always uses `createConfluxDevkitClient({ baseUrl })` where
  `baseUrl` defaults to `process.env.CFXDEVKIT_DEVNODE_SERVER_URL ?? 'http://localhost:52000'`
- [x] **P2.3** Add a health-check at startup: if `client.health.check()` rejects, log
  `"devnode-server not reachable at <url>. Start it with: cdk devnode start"` and `process.exit(1)`
- [x] **P2.4** Remove `@cfxdevkit/devnode-server` from `mcp-server/package.json` deps
- [x] **P2.5** Run `pnpm run build` in `mcp-server`; confirm no `devnode-server` imports remain

## P3 — Remove embedded server from vscode-extension

- [x] **P3.1** In `helpers/shared.ts`: remove `createDevnodeServerApp` import and all `app` /
  `fetchImpl` construction logic from `createSharedNodeRuntime`
- [x] **P3.2** `createSharedNodeRuntime` always constructs `createConfluxDevkitClient` with a plain
  `baseUrl`; spawning devnode-full as a child process is handled by the process manager
- [x] **P3.3** Confirm the extension's existing node process-manager (`helpers/node.ts`) is
  responsible for starting the devnode-full binary; update it to start the HTTP server too
- [x] **P3.4** Remove `@cfxdevkit/devnode-server` from `vscode-extension/package.json` deps;
  add `@cfxdevkit/devnode-full` to the process-manager dep if needed for launch
- [x] **P3.5** Run `pnpm run build` in `vscode-extension`; confirm no `devnode-server` imports remain

## P4 — Add devnode launch command to tooling-cli

- [x] **P4.1** Add `cdk devnode start [--port N]` command to `tooling-cli` that spawns `devnode-full`
  as a background process and prints the URL
- [x] **P4.2** Add `cdk devnode stop` command
- [x] **P4.3** Document the launch command in the devnode-core README

## Validate

- [x] **V.1** `grep -r "createDevnodeServerApp" mcp-server/src/ vscode-extension/src/` → 0 results
- [x] **V.2** `grep "devnode-server" mcp-server/package.json vscode-extension/package.json` → 0 results
- [x] **V.3** `pnpm run typecheck` passes for all affected packages
- [x] **V.4** Starting mcp-server without a running devnode-server prints the clear error and exits 1
- [x] **V.5** VS Code extension activates and connects to a spawned devnode-full server
