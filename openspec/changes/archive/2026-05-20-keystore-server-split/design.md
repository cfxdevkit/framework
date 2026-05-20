## Context

`@cfxdevkit/devnode-server` is a Hono application that mounts two unrelated route groups on one Express/Hono app: a keystore surface (`/keystore/*`) and a devnode-lifecycle surface (`/node/*`, `/accounts/*`, `/bootstrap/*`, `/mining/*`, `/deploy/*`, `/compiler/*`, `/session-keys/*`). Both groups share a `DevnodeServerController` passed at app construction time.

The keystore routes (`routes/keystore.ts`) and their backing service (`KeystoreService`, `keystore/domain.ts`, `keystore/operations.ts`, `keystore/runtime.ts`) have zero runtime dependency on `@cfxdevkit/devnode` or node lifecycle state. They only require `@cfxdevkit/services` (keystore backends), `@cfxdevkit/wallet` (HD derivation), and `@cfxdevkit/core` (address utils).

## Goals / Non-Goals

**Goals:**
- Create `@cfxdevkit/keystore-server` as a standalone Hono app exposing only `/keystore/*`
- Refactor `@cfxdevkit/devnode-server` to compose `keystore-server` rather than own the keystore code
- Allow CAS backend (and any future backend) to depend only on `keystore-server` without pulling `@cfxdevkit/devnode`

**Non-Goals:**
- Changing the public HTTP API shape (routes, request/response bodies)
- Extracting session-keys or accounts endpoints (those depend on the controller)
- Creating a new npm-published package (keystore-server is `workspace:*` only, not published)

## Decisions

### D1: Physical location — `repos/cfx-tools/packages/keystore-server/`
Follows existing cfx-tools convention. `pnpm-workspace.yaml` already covers `repos/cfx-tools/packages/*`. Only `.moon/workspace.yml` and `arch-rules.yaml` need updates.

### D2: keystore-server exports a Hono router factory, not a full app
`createKeystoreRouter(service: KeystoreService): Hono` — returns a pre-mounted router. `devnode-server` calls it and mounts the result under `/`. A standalone `createKeystoreApp(config)` is also exported for direct use.

### D3: Move source files, do not copy
`git mv` preserves history. Files moved:
- `devnode-server/src/keystore.ts` → `keystore-server/src/keystore.ts`
- `devnode-server/src/keystore/` → `keystore-server/src/keystore/`
- `devnode-server/src/routes/keystore.ts` → `keystore-server/src/routes/keystore.ts`

### D4: devnode-server imports from `@cfxdevkit/keystore-server`
After the move, `devnode-server/src/app.ts` imports `{ createKeystoreRouter }` from `@cfxdevkit/keystore-server` and mounts it. The public HTTP surface is identical.

### D5: Hono as the web framework
`keystore-server` depends on `hono` directly (same version as `devnode-server`).

## Risks / Trade-offs

- Net increase of one package to maintain, but with simpler responsibilities each
- `devnode-server` integration tests still need to test the `/keystore/*` routes (they are mounted, just sourced differently)
- Consumers importing `devnode-server`'s internal keystore exports (if any) would break — mitigated since `devnode-server` only exposes `.` and `./cli` sub-paths publicly
