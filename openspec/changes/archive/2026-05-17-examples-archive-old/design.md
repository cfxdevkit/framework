## Context

> Closure note (2026-05-17): Archive this change as deferred. The deletion work was not validated as complete; the old apps remain in the tree and still serve as source material for the remaining Phase 2 ports tracked in `artifacts/plan/phase-2-showcase-public.md`.

The old examples suite was built before the framework packages stabilized. It consists of five legacy SPAs plus an Express backend (`showcase-backend`) that pre-dates the shared local-runtime direction around `@cfxdevkit/devnode-server`. Once the keeper apps (`showcase-local`, `showcase-public`) are verified, these old apps are pure dead weight. This change removes them cleanly.

## Goals / Non-Goals

**Goals:**
- All five old Vite app directories are deleted
- `apps/showcase-backend/` is deleted only after its remaining logic is covered by the shared local-runtime control plane consumed by `showcase-local`
- `projects/examples/packages/showcase-ui/` remains in place as the keeper wrapper package
- Root `.moon/workspace.yml` and root `pnpm-workspace.yaml` are updated to remove all old references
- Workspace-level `pnpm install` runs cleanly after removal
- No references to removed packages remain in any `package.json` or config file

**Non-Goals:**
- Archiving the old code to a separate git branch or tag (git history preserves it)
- Keeping any part of `showcase-backend` as a long-term runtime dependency (its responsibilities must move into the shared local-runtime control plane first)

## Decisions

### 1. Hard delete, not deprecation directory
**Decision:** Delete the directories entirely, relying on git history for reference.  
**Rationale:** Deprecation directories ("_old/", "_archive/") add clutter and confuse tooling (linters, TypeScript). Git is the archive.

### 2. Verify before delete — run check:hotspots and tsc on the new apps first
**Decision:** Confirm `showcase-public` and `showcase-local` pass TypeScript and hotspot checks before executing any deletions.  
**Rationale:** If the new apps are broken, the old ones serve as a fallback reference. Delete only when confident.

## Risks / Trade-offs

- **Dangling cross-references**: If any docs or config still point at removed example app paths, builds and local tooling may keep trying to resolve dead projects. → Mitigation: grep for the legacy app names before and after deletion.
- **Moon task graph**: Moon may cache task references for deleted projects. → Mitigation: run `moon clean` after removal to clear task cache.

## Migration Plan

1. Confirm new apps are fully working (`pnpm build` passes for both)
2. `grep -r` for references to legacy app paths across the monorepo
3. Delete old app directories
4. Update root `.moon/workspace.yml` and root `pnpm-workspace.yaml`
5. Run `pnpm install` from monorepo root
6. Run `pnpm run check:hotspots` and `tsc` on affected packages
7. Run `moon clean` to clear cached task graph
