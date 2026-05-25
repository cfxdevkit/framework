## Context

`devnode-server` is a Hono HTTP server that wraps the full devnode stack and exposes a REST
control plane consumed by `@cfxdevkit/client`. Currently two consumers — `mcp-server` and
`vscode-extension` — use an in-process embedding pattern: when no external URL is configured
they call `createDevnodeServerApp()` and wire a custom `fetch` to bypass HTTP.

`@cfxdevkit/client` already has every namespace the consumers need (`node`, `keystore`,
`accounts`, `compiler`, `contracts`, `deploy`, `mining`, `sessionKeys`). The in-process mode
exists only as a development convenience — it was never a design requirement.

## Goals / Non-Goals

**Goals:**
- `mcp-server` and `vscode-extension` import only `@cfxdevkit/client`; no `devnode-server` dep
- Both resolve a devnode-server URL at startup; connection to that URL is the only coupling
- `devnode-server` is split into `devnode-core` (HTTP server + devnode + compiler + contracts)
  and `devnode-full` (adds keystore-server + services + wallet) for future consumers that
  don't need the full key-management stack
- A canonical launch path for devnode-server is documented and wired into tooling-cli

**Non-Goals:**
- Moving `compile()`, `deployContract()`, `readContract()` calls inside the extension to go
  through `client` — those are direct RPC/crypto operations, not devnode-server control plane
  calls; they are out of scope for this change
- Changing the `devnode-server` HTTP API surface
- Removing `@cfxdevkit/services` or `@cfxdevkit/wallet` from the extension (hardware wallet,
  local file keystore — these are inherently local and cannot be proxied)

## Decisions

**Always-external model.** Remove the embedded fallback entirely. If the server is not
running, the consumer fails with a clear connection error rather than silently starting an
in-process copy. This matches how production deployments work and makes the boundary explicit.

**`devnode-core` / `devnode-full` split.** The split follows the natural seam in
`devnode-server/package.json`: devnode + compiler + contracts + cdk form the chain-interaction
layer; keystore-server + services + wallet form the key-management layer. A consumer that only
needs chain control (future: automated testing harness, CI scripts) should not pull in wallet
code.

**Extension process manager starts devnode-full.** The VS Code extension already manages a
devnode child process; it should start `devnode-full` (the full server) as that child process
and then connect to it via `client`. The extension's `createSharedNodeRuntime` becomes a
thin wrapper around `ConfluxDevkitClient`.

**`mcp-server` requires external URL.** MCP server is a tool integration layer — it should
not own a devnode lifecycle. If `CFXDEVKIT_DEVNODE_SERVER_URL` is not set and the default
port is not reachable, it errors out with guidance.

## Risks / Trade-offs

- Extension startup now requires devnode-server to be running before the client connects —
  adds a process-launch step. Mitigated by making the extension spawn devnode-full itself as
  a child process (same UX, clean boundary).
- Integration tests that currently rely on in-process embedding need updating to start
  devnode-server as a real subprocess.
