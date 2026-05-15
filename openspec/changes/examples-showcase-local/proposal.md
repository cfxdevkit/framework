# Proposal: examples-showcase-local

## Why

The framework's local developer tooling — `@cfxdevkit/devnode` (embedded Conflux node), `@cfxdevkit/compiler` (Solidity compilation via solc), `@cfxdevkit/services` (file keystore), `@cfxdevkit/wallet` (managed signer, session keys) — has no cohesive demonstration. The old `apps/showcase-stack` and `apps/showcase` Vite apps showed these capabilities in isolation across separate UIs, each with their own Express backend (`apps/showcase-backend`). This change fills all chapter content in the `apps/showcase-local` skeleton and implements the backing API routes, creating a single Next.js app that covers the complete local dev workflow.

## What Changes

- **`apps/showcase-local/app/devnode/page.tsx`** — start/stop/mine a local Conflux node; view node status, block number, and connected peer count
- **`apps/showcase-local/app/keystore/page.tsx`** — create memory/file keystore; add accounts; list managed accounts; import/export (file provider only)
- **`apps/showcase-local/app/session-key/page.tsx`** — create session key from managed signer; define capability policy (contract + method allowlist, spend limit); issue and inspect attestation
- **`apps/showcase-local/app/compiler/page.tsx`** — select from template catalog (ERC-20, ERC-721); edit Solidity source; compile via `/api/compile`; inspect ABI and bytecode
- **`apps/showcase-local/app/deploy/page.tsx`** — deploy compiled contract to local devnode via managed signer; interact (call + send); inspect events
- **API routes**: implement `/api/devnode/*`, `/api/keystore/*`, `/api/session-key/*`, `/api/compile/*`, `/api/deploy/*` (all `runtime = 'nodejs'`)

## New Capabilities

- `showcase-local-chapters`: five chapter pages (devnode, keystore, session-key, compiler, deploy) with live demos against local runtime
- `showcase-local-api`: full API implementation backing all chapter demos

## Dependencies

- Depends on: `examples-shared-foundation` (apps/showcase-local skeleton + packages/showcase-ui)
- Packages used: `@cfxdevkit/devnode`, `@cfxdevkit/compiler`, `@cfxdevkit/services`, `@cfxdevkit/wallet`, `@cfxdevkit/core`, `@cfxdevkit/react`, `@cfxdevkit/example-showcase-ui`
