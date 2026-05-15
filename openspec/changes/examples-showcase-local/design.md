## Context

`apps/showcase-local` exists as a skeleton with stub routes and scaffolded API files (from `examples-shared-foundation`). This change implements the full content. Unlike `showcase-public`, every chapter here relies on the Node.js runtime: spawning a child process (`devnode`), running solc (`compiler`), writing to the filesystem (`keystore-file`), or issuing signed attestations (`session-key`). All API routes declare `export const runtime = 'nodejs'`.

The existing `apps/showcase-backend` (~1860 LoC Express app) serves as the reference implementation for API logic. It will be archived by `examples-archive-old`; this change re-implements the same functionality in Next.js API routes, modularized by chapter.

## Goals / Non-Goals

**Goals:**
- Each chapter page has a full live demo: UI → API → framework package → response displayed in LogBox
- API routes are modular — one directory per chapter, no monolithic router
- Devnode lifecycle (start/stop/mine) managed through a singleton module-level reference in the API layer
- File keystore persists to `<project-root>/.local-data/keystore/` (gitignored)
- Session key attestation is signed by a managed signer from the file keystore
- Compiler output (ABI, bytecode) flows directly to the deploy chapter via browser state (no database)

**Non-Goals:**
- Supporting mainnet/testnet in showcase-local (all demos target local devnode only)
- Authentication/authorization on API routes (local-only app, no auth needed)
- Persisting compiled artifacts or deployments across restarts

## Decisions

### 1. Devnode singleton lives in a module-level variable, not a database
**Decision:** Import `@cfxdevkit/devnode` in a shared module (`lib/devnode-instance.ts`) that holds the `DevNode` reference in a module-level variable.  
**Rationale:** Next.js dev server keeps module instances across requests in the same process. This is sufficient for a local demo. A restart resets the state, which is acceptable.

### 2. Keystore stored in `.local-data/keystore/` with path from env var
**Decision:** File keystore path read from `LOCAL_KEYSTORE_PATH` env var, defaulting to `<cwd>/.local-data/keystore/`.  
**Rationale:** Allows the user to point at a custom path without changing code. Default is gitignored. Memory keystore is also supported for ephemeral demo sessions.

### 3. Compiler template selection, not arbitrary file upload
**Decision:** The compiler chapter offers a dropdown of templates from `@cfxdevkit/compiler`'s `getTemplate()` function, plus a free-text editor for custom Solidity. No file upload.  
**Rationale:** File upload adds surface area and complexity. The template catalog covers the key use cases. Power users can paste code into the editor.

### 4. Deploy chapter uses managed signer from keystore (not wagmi)
**Decision:** Deploy and interact calls go through `signerFromKeystore()` from `@cfxdevkit/wallet`, not through wagmi or a browser wallet.  
**Rationale:** This chapter demonstrates the server-side managed signer workflow, not browser wallet interaction. The local devnode has pre-funded accounts accessible via the keystore.

### 5. Session key chapter shows attestation issuance only
**Decision:** Show `createSessionKey()`, `defineCapabilityPolicy()`, and the resulting attestation JWT. Do not show a full relay transaction flow (that's CAS's domain).  
**Rationale:** The relay workflow requires a full automation backend. The showcase-local chapter focuses on the key creation and policy definition primitives.

## Risks / Trade-offs

- **Devnode binary availability**: `@cfxdevkit/devnode` ships a native binary for the host platform. In a Docker container or CI environment, the binary may not be executable. → Mitigation: show a clear error state in the devnode page if `DevNode.check()` fails.
- **Next.js module caching in prod build**: Next.js may bundle server-side modules differently in production builds. Module-level singletons may not behave as expected under `next start`. → Mitigation: document that showcase-local is for development only (`pnpm dev`); note this in the landing page.
- **Solc download latency**: `ensureSolc()` downloads the solc binary on first use. This can take 10–30 seconds. → Mitigation: show a "Downloading compiler..." status in the UI and call `ensureSolc()` proactively on app startup (API route triggered from the compiler page's first render).

## Migration Plan

The old `apps/showcase-backend` Express app is not modified by this change. It will be removed by `examples-archive-old`. The API logic is re-implemented in the Next.js API routes, so there is no compatibility concern.
