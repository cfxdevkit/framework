## Why

`@cfxdevkit/devnode-server` bundles two unrelated concerns into one Express app: the keystore HTTP surface (wallet root init, account derivation, PIN unlock/lock, reveal-token flow) and the devnode lifecycle surface (start/stop/mine, bootstrap, deploy, compiler). Any backend that only needs keystore operations — most notably the CAS backend — must take a transitive dependency on `@cfxdevkit/devnode`, which pulls in the Conflux Go-node binary wrapper and all node-profile logic.

Splitting into `@cfxdevkit/keystore-server` (standalone keystore API) and a slimmed `@cfxdevkit/devnode-server` (imports keystore-server, adds node lifecycle) removes `@cfxdevkit/devnode` from the CAS backend's dependency graph entirely.

## What Changes

- New package `@cfxdevkit/keystore-server` in `repos/cfx-tools/packages/keystore-server/` containing:
  - `KeystoreService` class (extracted from `devnode-server/src/keystore.ts`)
  - `keystore/` domain files (domain.ts, operations.ts, runtime.ts)
  - `/keystore/*` Express router
  - Standalone `createApp()` that mounts only the keystore routes
  - Dependencies: `@cfxdevkit/core`, `@cfxdevkit/services`, `@cfxdevkit/wallet`, `hono` or `express`
- `@cfxdevkit/devnode-server` refactored to:
  - Import `createKeystoreApp` / keystore router from `@cfxdevkit/keystore-server`
  - Mount it alongside the existing devnode routes
  - Remove duplicated keystore source files
  - Add `@cfxdevkit/keystore-server` as a dependency

## Capabilities

### New Capabilities
- `keystore-server-standalone`: `@cfxdevkit/keystore-server` runs as an independent HTTP server exposing the full keystore API (`/keystore/*`) without any devnode dependency.

### Modified Capabilities
- `devnode-server-control-plane`: `@cfxdevkit/devnode-server` now composes keystore-server internally; its public HTTP API is unchanged.

## Impact

- `repos/cfx-tools/packages/devnode-server/` — source refactored, package.json gains keystore-server dep
- `repos/cfx-tools/packages/keystore-server/` — new package created
- `pnpm-workspace.yaml` — no change (already covers `repos/cfx-tools/packages/*`)
- `.moon/workspace.yml` — add keystore-server project entry
- `arch-rules.yaml` — add keystore-server to Tier 1 allowlist
- No consumer API changes — existing `/keystore/*` routes served on the same paths
