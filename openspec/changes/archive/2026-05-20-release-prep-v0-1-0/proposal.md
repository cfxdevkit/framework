## Why

All five planned OpenSpec changes (showcase consolidation, shared backend alignment, CAS cleanup, public showcase completion, legacy retirement) are fully complete. The monorepo needs a final housekeeping pass — archive completed changes, fill the empty CHANGELOG, review docs for stale references, and verify all root quality gates pass — before the `v0.1.0` tag can be created.

## What Changes

- Archive the five `all_done` changes: `showcase-local-refactor`, `showcase-public-completion`, `shared-backend-tooling-alignment`, `cas-frontend-cleanup`, `legacy-showcase-cleanup`
- Write `CHANGELOG.md` `v0.1.0` entry summarising the framework packages and application milestones
- Update `ARCHITECTURE.md` to remove `@cfxdevkit/hardware-bridge` stub entry and align the Tier table to the actual package state
- Update `docs/STRUCTURE.md` to reflect the retired apps
- Verify `pnpm -w typecheck`, `pnpm -w lint`, `pnpm -w test`, and `pnpm check:unused` all pass clean from the workspace root

## Capabilities

### New Capabilities

- `release-v0-1-0`: The workspace passes all root quality gates and carries accurate release documentation; the `v0.1.0` tag can be applied.

### Modified Capabilities

- `framework-release-readiness`: The existing spec's release-documentation and quality-gate requirements are now being satisfied.

## Impact

Documentation files (`CHANGELOG.md`, `ARCHITECTURE.md`, `docs/STRUCTURE.md`). No package code changes. OpenSpec change directories moved to archive.
