# Phase 4 — Release Preparation

**Workspace root:** `/workspaces/root`  
**Run all commands from:** `/workspaces/root`  
**See COMPLETION_PLAN.md** for the full monorepo layout reference.

**Goal:** Final technical and organizational cleanup before tagging `v0.1.0`.

This phase runs after Phases 0–3 are complete. It is not a big-bang step — it's a checklist of small verifications and housekeeping tasks.

---

## Workspace Cleanup

### Remove deleted apps from workspace configs

After deleting `showcase`, `showcase-browser`, `showcase-stack`, `showcase-gateway`, `showcase-backend`, and `hardware-wallet-showcase` (the first five are tracked in Phase 0; `hardware-wallet-showcase` is removed after the Phase 2 port):

- [ ] Remove entries from `/workspaces/root/pnpm-workspace.yaml`
- [ ] Remove from `/workspaces/root/.moon/workspace.yml` (lists all packages known to Moon)
- [ ] Search for per-package `moon.yml` files in deleted directories and confirm they are gone with the directory
- [ ] Check `/workspaces/root/projects/examples/package.json` — remove any `workspaces` array entries for deleted apps
- [ ] Check `infrastructure/` for any nginx/caddy/proxy config that routes to deleted apps (e.g., gateway config)

### Remove hardware-bridge stub

- [ ] Delete `repos/cfx-domain/packages/hardware-bridge/` (tracked in Phase 0)
- [ ] Confirm removed from `/workspaces/root/pnpm-workspace.yaml`
- [ ] Confirm removed from `/workspaces/root/.moon/workspace.yml`
- [ ] Run `pnpm check:unused` — no remaining references to `@cfxdevkit/hardware-bridge`

---

## Code Quality Gates

All must pass before tagging:

### TypeScript
```
pnpm -w typecheck
```
Expected: zero errors. Warnings are acceptable but should be reviewed.

### Linting
```
pnpm -w lint
```
Expected: zero errors. Warnings about unused variables in WIP app code are acceptable (they are excluded in Biome config).

### Tests
```
pnpm -w test
```
Expected: zero failures. Skipped tests are acceptable if they require external devices (e.g., Ledger hardware tests).

### Dead code / deps
```
pnpm check:unused
```
Expected:
- 0 unused files
- 0 unused deps
- Unused exports: should be near zero after Phase 1–3 cleanup; any remaining should be explicitly annotated in `knip.config.ts` with a comment explaining why they are acceptable (e.g., `// WIP: cascade wallet integration pending`)
- Duplicate exports: ABI aliases (`ERC20_ABI` ↔ `erc20Abi`) are intentional; document in knip config

---

## Documentation Updates

### `/workspaces/root/README.md`
Update the showcase app table to list only keepers:

| App | URL | Description |
|-----|-----|-------------|
| showcase-local | http://localhost:3011 | Full local dev environment (devnode embedded + keystore + compiler + deploy) |
| showcase-public | http://localhost:3010 | Public SDK demos (keys, wallets, hardware, RPC, SIWE) |

Remove all references to `showcase`, `showcase-browser`, `showcase-stack`, `showcase-gateway`.

### `/workspaces/root/ARCHITECTURE.md`
- Verify Tier 0/1 table matches actual package state (use COMPLETION_PLAN.md package table as reference)
- Remove `@cfxdevkit/hardware-bridge` stub entry
- Update showcase app descriptions

### `/workspaces/root/CHANGELOG.md`
- Add `v0.1.0` entry summarizing:
  - Framework packages stabilized (list all Tier 0 + Tier 1)
  - showcase-local: full local dev workspace
  - showcase-public: hardware wallet demo, browser wallet demo, Core RPC demo
  - CAS: DeFi automation platform with keeper engine
  - Legacy showcases removed

### `/workspaces/root/docs/`
- Update `docs/STRUCTURE.md` to reflect deleted apps
- Review `docs/architecture/` for stale references to deleted patterns (guide/tutorial concept, old server-action approach in showcase-local)

---

## Shared Backend Alignment

The release plan needs an explicit tooling-integration pass for the packages under `repos/cfx-tools/` that are supposed to share the same backend contract as showcase-local.

**Validated current state:**
- `repos/cfx-tools/packages/mcp-server/` documents HTTP via `@cfxdevkit/client` as the default integration path, but its runtime handlers still manage an in-process `@cfxdevkit/devnode` singleton
- `repos/cfx-tools/packages/vscode-extension/` documents `@cfxdevkit/devnode-server` as the canonical backend contract, but its helpers still import `createDevNode` from `@cfxdevkit/devnode`
- `repos/cfx-tools/packages/devnode-server/` already exposes key routes such as `GET /network/current`, `GET /network/capabilities`, `GET /network/config`, `POST /network/config`, `POST /network/set`, `POST /deploy/run`, `POST /contracts/register`, `POST /contracts/read`, `POST /contracts/write`, and `POST /contracts/:id/call`
- `repos/cfx-tools/packages/client/` already includes typed namespaces for node, keystore, network, contracts, and deploy flows; the remaining work is to migrate the extension and MCP to that client surface and add any still-missing endpoints or methods needed by their full tool/command sets

**Release requirement:** both MCP and the VS Code extension should use `@cfxdevkit/client` against `@cfxdevkit/devnode-server` as the canonical control plane. If a temporary adapter remains anywhere, it must be treated as a compatibility layer that preserves the exact same semantics and state model, not as a separate runtime.

- [ ] Audit extension + MCP command/tool needs against the existing `@cfxdevkit/devnode-server` route surface
- [ ] Implement any missing `@cfxdevkit/devnode-server` HTTP endpoints required by the extension or MCP before wiring consumers
- [ ] Add or finish the `@cfxdevkit/client` methods needed for those routes so both consumers share one typed client surface
- [ ] Replace direct `@cfxdevkit/devnode` control paths in `repos/cfx-tools/packages/mcp-server/` with `@cfxdevkit/client` calls to `@cfxdevkit/devnode-server`
- [ ] Replace direct `@cfxdevkit/devnode` control paths in `repos/cfx-tools/packages/vscode-extension/` with `@cfxdevkit/client` calls to `@cfxdevkit/devnode-server`
- [ ] Add smoke coverage proving the extension and MCP can perform node status, network switching, deploy, contract registry, contract call, keystore, and account operations through the shared client/backend path
- [ ] Update package docs so implementation notes no longer describe the old direct-`devnode` path as current behavior

---

## VS Code Extension Cleanup

The vscode-extension (`repos/cfx-tools/packages/vscode-extension/`) still carries two pass-through symbol aliases that are already marked `@deprecated` in source and should be removed during release cleanup:

| Symbol | File | Action |
|--------|------|---------|
| `makeNetworkRow()` | `repos/cfx-tools/packages/vscode-extension/src/views/network/node.ts` | Delete (deprecated alias) |
| `makeNodeRow()` | same file | Delete (deprecated alias) |

After deleting: run `pnpm -w typecheck` to confirm no TypeScript errors in the extension.

### MCP cleanup

- [ ] Review `repos/cfx-tools/packages/mcp-server/API.md` and `README.md` after the shared-backend alignment pass so they match the implemented runtime model
- [ ] Remove any now-stale wording that describes the runtime handlers as intentionally incomplete once the client-backed wiring lands

---

## Deprecation Notices for CAS Spec Artifacts

The `projects/cas/openspec/changes/` directory should be reviewed:
- Any old spec cycle directories (e.g., `examples-shared-foundation/`) should be moved to `projects/cas/openspec/changes/archive/`
- Outdated spec files should have a `> ⚠️ DEPRECATED` notice added at the top

---

## Version Tagging

Once all quality gates pass and all cleanup is done:

```bash
# Ensure workspace is clean
git status

# Run full quality suite
pnpm -w typecheck && pnpm -w lint && pnpm -w test && pnpm check:unused

# Tag
git tag -a v0.1.0 -m "First framework release: showcase-local, showcase-public, CAS"
git push origin v0.1.0
```

---

## Post-v0.1.0 Backlog (Not Blocking)

These items are explicitly deferred past v0.1.0:

| Item | Reason for deferral |
|------|---------------------|
| File keystore panel in showcase-public | showcase-local owns file keystore (it has an embedded keystore service); showcase-public is a pure frontend app |
| SIWE in showcase-local | SIWE is for browser wallet auth; showcase-local uses managed wallets |
| OneKey + Satochip panels in showcase-public hardware section | Adapters exist in Tier 0; UI wrapping is mechanical but not urgent |
| `@cfxdevkit/create` scaffolding CLI full test coverage | Works but edge cases in template discovery untested |
| CAS SSE reconnect/backoff hardening | Frontend already consumes `/sse`; only resilience polish is deferred |
| `pnpm check:unused` — 154 config hints | These are knip suggestions to remove empty glob patterns; low priority |
