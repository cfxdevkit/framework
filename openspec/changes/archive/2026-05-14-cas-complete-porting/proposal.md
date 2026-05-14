## Why

The CAS (Conflux Automation System) DeFi automation app was partially ported from the legacy `devkit` framework to the new framework (`projects/cas/`) but the porting was done without OpenSpec and without covering all original features. Key UI capabilities are missing (particularly the ERC-20 approval manager), there are API surface inconsistencies, and the frontend token display is degraded. The project needs to be brought to full parity — and beyond — so it is a working, deployable DeFi automation platform.

## What Changes

- **New**: `ApprovalWidget` — per-token ERC-20 allowance manager panel for the frontend dashboard, allowing users to view, revoke and set-exact approvals on the `AutomationManager` contract
- **New**: `DELETE /jobs/:id` backend route — exposes hard-delete for jobs in addition to soft-cancel
- **Fix**: `JobsTable` token display — resolve raw hex addresses to symbol + logo using pool context, matching original dashboard UX
- **Fix**: `SafetyPanel` advanced controls — add runtime-configurable max swap cap, slippage ceiling and max retries fields to the admin safety page (currently env-var only)
- **Fix**: `WalletPanel` connect flow — ensure chain switching correctly handles eSpace mainnet vs testnet and shows correct user feedback
- **New**: `pools-context` integration in StrategyBuilder — share pool data loaded by pools context instead of fetching independently
- **Fix**: Frontend `Next.js` API proxy — add `src/app/api/[...path]/route.ts` for backend proxying so frontend and backend can run on the same origin in production
- **Fix**: End-to-end smoke test — add an app-level integration test covering the full SIWE login → create job → SSE update → cancel flow

## Capabilities

### New Capabilities

- `cas-approval-widget`: ERC-20 allowance manager panel — lists allowances by token, shows committed amount from active jobs, lets admins revoke or set exact allowances via on-chain transactions
- `cas-job-delete`: Hard-delete backend route and client SDK method for removing jobs from the database (as opposed to soft-cancel)
- `cas-token-display`: Token symbol and logo resolution in `JobsTable` using the existing pools context cache
- `cas-safety-config`: Runtime-editable safety guard configuration (max swap cap, slippage ceiling, max retries) persisted in the SQLite settings table
- `cas-api-proxy`: Next.js API route proxy so CAS frontend can proxy backend calls on the same origin
- `cas-e2e-smoke`: End-to-end smoke test covering the core automation workflow

### Modified Capabilities

## Impact

- `projects/cas/apps/frontend/src/components/` — new `ApprovalWidget.tsx`, updated `JobsTable.tsx`
- `projects/cas/apps/frontend/src/app/` — new `api/[...path]/route.ts` proxy
- `projects/cas/apps/frontend/src/app/safety/` — updated with advanced safety config UI
- `projects/cas/apps/backend/src/routes/jobs.ts` — add DELETE handler
- `projects/cas/apps/backend/src/db/sqlite.ts` — add settings store fields for safety config
- `projects/cas/packages/shared/src/` — extend `CasApiClient` with `deleteJob`, safety config methods
- `projects/cas/apps/backend/src/app.test.ts` — extend e2e test coverage
