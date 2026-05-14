## Context

CAS (Conflux Automation System) is a DeFi automation platform at `projects/cas/` consisting of:

- **Backend** (`apps/backend/`): Express + `@cfxdevkit/automation` Keeper + SQLite (via Drizzle ORM). Routes: `/health`, `/auth`, `/jobs`, `/admin`, `/pools`, `/sse`, `/system`.
- **Frontend** (`apps/frontend/`): Next.js 15 app with Wagmi/SIWE authentication. Pages: `/` (home), `/create` (strategy builder), `/dashboard` (job console), `/safety` (system admin).
- **Shared** (`packages/shared/`): `@cfxdevkit/cas-shared` package with DTOs, `CasApiClient`, and `executionToCasDto`/`jobToCasDto` mappers.

The porting from the legacy `devkit` framework is ~80% complete. The remaining gaps are:

1. **ApprovalWidget missing** — original had a full ERC-20 allowance manager; ported version has none.
2. **JobsTable token display degraded** — shows raw `0x1234...5678` truncated addresses instead of token symbols + logos.
3. **Safety config is env-var-only** — `SafetyGuard` parameters (max swap cap, slippage ceiling, max retries) cannot be changed at runtime.
4. **No DELETE /jobs/:id route** — `CasApiClient.deleteJob()` exists but no backend handler.
5. **No API proxy** — frontend must hardcode backend URL; there is no `/api/[...path]` Next.js proxy route.
6. **E2E test coverage is thin** — `app.test.ts` only tests happy-path auth; no full workflow coverage.

## Goals / Non-Goals

**Goals:**
- Port and adapt the `ApprovalWidget` to use `@cfxdevkit/cas-shared` types and `CasApiClient`
- Resolve token symbols/logos from pools context in `JobsTable`
- Add runtime-editable safety config persisted in `SqliteSettingsStore`
- Add `DELETE /jobs/:id` backend route and wire into shared client
- Add Next.js API proxy route
- Expand e2e test to cover create → SSE update → cancel flow

**Non-Goals:**
- TWAP and Swap job UI (strategy builder already accepts them server-side, but UI flows are deferred)
- Multicurrency gas estimation
- Admin job search / filtering UI
- Mobile-responsive redesign

## Decisions

### 1. ApprovalWidget: Multicall3 vs individual RPC calls

**Decision**: Keep Multicall3 batch read pattern from original, but use wagmi's `useReadContracts` hook instead of hand-rolled `createPublicClient`.

**Rationale**: `useReadContracts` handles caching, loading states and error surfacing natively within the wagmi ecosystem already used in the project. The original used a standalone `createPublicClient` to avoid React hook constraints; that constraint doesn't apply here since the component is always client-rendered.

**Alternative considered**: Direct fetch via `CasApiClient` (add a new endpoint). Rejected — allowances are on-chain state; reading them client-side avoids adding a backend oracle that would need to track every address's allowances.

### 2. Safety config persistence: new settings keys vs new DB table

**Decision**: Extend `SqliteSettingsStore` with typed getters/setters for `safetyMaxSwapUsd`, `safetySlippageBps`, `safetyMaxRetries` stored as individual `key/value` rows.

**Rationale**: The settings table already uses a generic key/value schema. Adding three new keys is zero-migration — the table schema doesn't change. Creating a new `safety_config` table would require a DB migration.

**Alternative considered**: New DB table with one row. Rejected due to migration complexity and no type benefit over typed wrapper methods.

### 3. API proxy: Next.js route handler vs next.config rewrites

**Decision**: Use a Next.js App Router `route.ts` catch-all at `src/app/api/[...path]/route.ts` that pipes requests to `NEXT_PUBLIC_CAS_API_URL`.

**Rationale**: Route handlers allow request/response manipulation (strip cookies, inject auth headers) and work with the App Router already in use. `next.config` rewrites are simpler but can't transform headers.

**Alternative considered**: `next.config` rewrites. Viable for basic proxying but less flexible; kept as fallback documentation.

### 4. Token display: local pools-context cache vs new backend endpoint

**Decision**: Read token metadata from the existing `usePoolsContext()` hook in `JobsTable`, which already maintains a `tokens` array with `address`, `symbol`, `decimals`, and `logoURI`.

**Rationale**: The pools context is already loaded before the dashboard renders (fetched on `providers.tsx` mount). Adding a backend endpoint would duplicate data that is already available client-side and would increase backend complexity.

### 5. DELETE vs cancel semantics

**Decision**: `DELETE /jobs/:id` performs a hard delete (removes the row from DB). `POST /jobs/:id/cancel` continues to do a soft cancel (status = `cancelled`). Client exposes both.

**Rationale**: Hard delete is useful for test cleanup and admin housekeeping. Soft cancel preserves audit history. Both operations are useful and non-overlapping.

## Risks / Trade-offs

- **Multicall3 address** — The Multicall3 address `0xcA11bde05977b3631167028862bE2a173976CA11` may not be deployed on Conflux eSpace testnet. Mitigation: fall back to sequential `eth_call` if Multicall3 fails, or skip batch and use wagmi `useReadContracts` with `allowFailure: true`.
- **Pool context not loaded before ApprovalWidget renders** — If pools haven't loaded yet, token symbols will be unknown. Mitigation: show address abbreviation as fallback, same as current `JobsTable` behavior.
- **Settings store migration** — Existing SQLite files have no `safety_*` keys. Reads default to safe values (no cap, 0 slippage = pass-through) on first run.
- **API proxy adds latency** — Every frontend → backend call goes through Node.js proxy when using same-origin mode. Acceptable for dev; in production, direct CDN routing to backend is preferred.

## Migration Plan

1. Add new safety config keys to `SqliteSettingsStore` (backward-compatible, reads return defaults if key absent).
2. Add `DELETE /jobs/:id` to backend routes (additive only, no existing behavior changes).
3. Extend `CasApiClient` with `deleteJob` and safety config methods (additive).
4. Add `ApprovalWidget` component and wire into dashboard layout.
5. Update `JobsTable` to read token metadata from pools context.
6. Add `SafetyConfigPanel` sub-component to the safety page.
7. Add Next.js API proxy route.
8. Expand e2e tests.

No database schema migrations required. All backend changes are additive. No breaking API changes.

## Open Questions

- Should `ApprovalWidget` be accessible to all users or admin-only? (Original: accessible to the connected user for their own tokens.)
- Should hard-delete (`DELETE /jobs/:id`) be admin-only or available to the job owner? (Default decision: job owner can delete their own jobs; admin can delete any.)
