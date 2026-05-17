# Phase 3 — CAS: WIP Analysis and Cleanup

**Workspace root:** `/workspaces/root`  
**CAS root:** `projects/cas/` (all paths in this file are relative to workspace root unless stated)  
**See COMPLETION_PLAN.md** for the full monorepo layout reference.

**Goal:** Determine what in CAS is genuinely WIP vs lingering dead spec; delete or complete accordingly.

---

## CAS Architecture Overview

CAS (Conflux Automation Site) is a DeFi automation platform located at `projects/cas/` with two apps:

- **frontend** (`projects/cas/apps/frontend/`) — Next.js 16, browser wallet (wagmi + SIWE), job management UI
- **backend** (`projects/cas/apps/backend/`) — Express + SQLite, keeper engine, REST API

**Framework packages used:**
- `@cfxdevkit/automation` — SQLite schema, job/execution repos, keeper engine
- `@cfxdevkit/protocol` — contract addresses (AutomationManager, WCFX, pools)
- `@cfxdevkit/wallet-connect/siwe` — SIWE authentication
- `@cfxdevkit/wallet-connect` — wagmi without ConnectKit
- `@cfxdevkit/core`, `@cfxdevkit/services`, `viem`

---

## What Is Complete

The following features are **fully implemented** and should not be touched during this phase:

| Feature | Location | Status |
|---------|----------|--------|
| SIWE authentication | `projects/cas/apps/frontend/` + backend `routes/auth.*` | ✅ Complete |
| Job CRUD | Frontend `StrategyModal` + `JobForm` + backend `/jobs` | ✅ Complete |
| Job types: Swap, Limit Order, DCA, TWAP | `JobForm.tsx` | ✅ Complete |
| SQLite job persistence | `@cfxdevkit/automation` + backend | ✅ Complete |
| Safety configuration | `SystemAdminPanel.tsx` + backend `/admin` | ✅ Complete |
| Keeper worker (embedded) | Backend worker + `@cfxdevkit/automation` engine | ✅ Complete |
| Admin pause/resume | `SystemAdminPanel.tsx` + backend `/admin` | ✅ Complete |
| Pool fallback mechanism | Backend `/pools` | ✅ Complete |
| Server-sent events route | Backend `/sse` + frontend `Dashboard` `EventSource` consumer | ✅ End-to-end live |
| Approval workflow | `ApprovalWidget`, `ApprovalsModal` | ✅ Complete |
| WCFX wrap helper | `WcfxWrapModal` | ✅ Complete |
| Dashboard + job list | `Dashboard` component | ✅ Complete |

---

## The WIP Remnants (Detailed Analysis Required)

### 1. `projects/cas/apps/frontend/src/app/create/` — Redirected Route with an Orphaned View

**Verified current state:** `projects/cas/apps/frontend/src/app/create/page.tsx` already redirects to `/`. The leftover implementation is `CreateStrategyView.tsx`, which appears to be an orphaned older full-page flow.

**What replaced it:** The `StrategyModal` component, which opens job creation as a modal from within the dashboard. This approach was adopted because it keeps the user in context and doesn't require a page navigation.

**Important nuance:** The stale route does **not** imply that `lib/strategy.ts` and `lib/ethereum.ts` can be deleted wholesale.
- `lib/strategy.ts` is still used by `StrategyBuilder`, `StrategyBuilderParts`, `ApprovalWidget`, and `WcfxWrapModal`
- `lib/ethereum.ts` still exports `readTargetEspaceChain()`, which is used by the auth context and network-switch hook
- Only specific exports in those files currently look unused

**Action Required:**

1. **Read `projects/cas/apps/frontend/src/app/create/`** — get full directory listing and read each file
2. **Compare with `StrategyModal` / `JobForm`** — both at `projects/cas/apps/frontend/src/components/` — determine if `create/` has any logic NOT present in the modal flow:
   - If it has the same job types and fields → the entire `create/` route is dead, delete it
   - If it has unique job types, validation logic, or token-selection flows not in the modal → extract those pieces into `JobForm.tsx` and then delete `create/`
3. **Read `projects/cas/apps/frontend/src/lib/ethereum.ts` and `projects/cas/apps/frontend/src/lib/strategy.ts`** — prune only the specific unused exports; keep the files themselves unless they become empty

**Expected outcome:** `create/` route folder deleted (or reduced to a redirect-free state if the folder is removed entirely), `CreateStrategyView.tsx` deleted, and the specific unused exports in `strategy.ts` / `ethereum.ts` trimmed.

### 2. SSE Frontend Consumption

The backend exposes `GET /sse` for live job update events (route in `projects/cas/apps/backend/src/routes/`).

**Verified current state:** The frontend already consumes this stream in `projects/cas/apps/frontend/src/components/Dashboard/Dashboard.tsx` via `new EventSource(client.sseUrl())`.

**Action Required:**
1. Search `projects/cas/apps/frontend/src/` for `EventSource`, `useSSE`, or `/sse`
2. Verify whether the current implementation needs reconnect/backoff behavior. Right now `onerror` just closes the stream.
3. Decide whether reconnect is required for `v0.1.0` or can remain a post-release improvement

### 3. Keeper Registration Flow

Documentation mentions a one-time signer registration step required before jobs execute.

**Verified current state:** This is already documented in `projects/cas/README.md`, and the interactive setup flow under `projects/cas/packages/setup/` includes keeper configuration / registration checks. There is no evidence that `v0.1.0` needs a separate frontend registration UI.

**Action Required:**
1. Confirm the README + setup wizard coverage is sufficient for release
2. Only add frontend UI if product requirements explicitly say keeper registration must happen in-browser

---

## Full Analysis Task

Before writing any OpenSpec for CAS, run an analysis agent that reads the actual files. This phase file is a guide for that analysis, not a final answer.

**Files to read in the analysis:**

```
projects/cas/apps/frontend/src/app/create/          ← full directory listing + read all files
projects/cas/apps/frontend/src/components/JobForm.tsx
projects/cas/apps/frontend/src/components/StrategyModal.tsx
projects/cas/apps/frontend/src/components/SystemAdminPanel.tsx
projects/cas/apps/frontend/src/components/Dashboard.tsx
projects/cas/apps/frontend/src/lib/ethereum.ts
projects/cas/apps/frontend/src/lib/strategy.ts
projects/cas/apps/backend/src/routes/               ← full directory listing
projects/cas/openspec/                              ← any remaining spec files
```

---

## OpenSpec Implications

If the analysis confirms that the leftover `create/` implementation is dead:

- **OpenSpec task:** Delete `projects/cas/apps/frontend/src/app/create/` (including `CreateStrategyView.tsx`) and trim only the specific unused exports from `projects/cas/apps/frontend/src/lib/strategy.ts` and `projects/cas/apps/frontend/src/lib/ethereum.ts`
- Run `pnpm -w typecheck` and `pnpm check:unused` from `/workspaces/root` — CAS unused exports should drop by 8
- No new functionality is needed in CAS for v0.1.0

If the analysis finds the `create/` route has unique logic:

- **OpenSpec task:** Extract unique logic into `projects/cas/apps/frontend/src/components/JobForm.tsx`, then delete the route
- May require a minor `JobForm` update

---

## Task List for This Phase

All commands run from `/workspaces/root`.

- [ ] Run analysis agent: read all files listed in the "Full Analysis Task" section
- [ ] Compare `create/` flow vs `StrategyModal` + `JobForm` — document differences if any
- [ ] Determine SSE reconnect requirements (frontend already consumes `EventSource` in Dashboard)
- [ ] Confirm keeper registration stays documented in `projects/cas/README.md` / setup wizard rather than the frontend UI
- [ ] Based on analysis: delete `projects/cas/apps/frontend/src/app/create/` and `CreateStrategyView.tsx` (expected)
- [ ] Based on analysis: trim only the unused exports from `projects/cas/apps/frontend/src/lib/strategy.ts` and `lib/ethereum.ts`
- [ ] Decide whether Dashboard SSE needs reconnect/backoff now or can remain a TODO
- [ ] Run `pnpm -w typecheck` — must pass clean
- [ ] Run `pnpm check:unused` — 8 CAS unused exports should clear
