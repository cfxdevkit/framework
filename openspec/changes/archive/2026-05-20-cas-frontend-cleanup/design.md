## Context

The authenticated CAS experience already lives on `/`, where the dashboard opens `StrategyModal` for new strategy creation and `Dashboard` consumes SSE updates. The stale `/create` folder no longer owns the user flow; it only preserves a redirect shell and some dead implementation history. Cleanup should remove that dead implementation while preserving the current UX contract.

## Goals / Non-Goals

**Goals:**
- Keep the home-page modal as the only authenticated strategy-creation surface.
- Remove the orphaned create-page implementation and trim unused exports around it.
- Preserve compatibility redirects for old entry routes.

**Non-Goals:**
- Rebuild the CAS dashboard or strategy builder UX.
- Add SSE reconnect behavior unless it is required to support the existing contract.
- Move keeper registration into the frontend.

## Decisions

- Treat `/` plus `StrategyModal` as the canonical strategy-creation flow.
- Preserve redirect behavior for `/create` and `/dashboard` instead of allowing those paths to become broken legacy entry points.
- Trim only the unused exports in `lib/ethereum.ts` and `lib/strategy.ts`; keep the files themselves because they still support live components.

## Risks / Trade-offs

- [Cleanup removes logic still needed by the modal flow] → Compare the old create path with `StrategyModal` and `JobForm` before deleting orphaned code.
- [Legacy routes regress from redirect to error] → Preserve or reassert redirect behavior in the route contract.
- [SSE cleanup scope expands unnecessarily] → Keep reconnect/backoff as an explicit decision point instead of folding it into route cleanup by default.
