## 1. Flow Comparison

- [x] 1.1 Compare the stale `/create` implementation against `StrategyModal` and `JobForm` to confirm no unique behavior remains.
	- The stale view only wrapped `StrategyBuilder` in a page shell and redirected success to `/dashboard`; `StrategyModal` remains the canonical `StrategyBuilder` owner.
- [x] 1.2 Confirm the current dashboard continues to own the authenticated strategy-creation UX.
	- `/` renders the dashboard and opens `StrategyModal` from the New Strategy action; `/dashboard` remains a compatibility redirect.

## 2. Route and Export Cleanup

- [x] 2.1 Delete the orphaned create-page implementation while preserving the compatibility redirect for `/create`.
	- Removed `CreateStrategyView.tsx`; kept `src/app/create/page.tsx` redirecting to `/`.
- [x] 2.2 Trim only the unused exports from `lib/ethereum.ts` and `lib/strategy.ts`.
	- Removed unused wallet helper exports from `lib/ethereum.ts` and unused strategy helper exports from `lib/strategy.ts`.

## 3. Validation

- [x] 3.1 Re-verify `/dashboard` and `/create` redirect behavior after the cleanup.
	- Both route files still call `redirect('/')`.
- [x] 3.2 Decide and document whether SSE reconnect/backoff remains deferred or must be implemented now.
	- Documented reconnect/backoff as deferred in `projects/cas/README.md`; the dashboard still does an authenticated initial jobs load and closes SSE on error.
- [x] 3.3 Run the affected frontend validation and workspace typecheck after the cleanup lands.
	- Passed `pnpm --filter @cfxdevkit/cas-frontend typecheck`, `pnpm --filter @cfxdevkit/cas-frontend lint`, and `pnpm -w typecheck`.
- [x] 3.4 Run `pnpm check:unused` and confirm the targeted CAS dead exports and orphaned route files clear from the report.
	- `pnpm check:unused` still reports unrelated workspace items, but no entries for `src/app/create`, `src/lib/ethereum.ts`, or `src/lib/strategy.ts`.
