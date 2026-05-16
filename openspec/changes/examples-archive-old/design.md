## Context

The old examples suite was built before the framework packages stabilized. It consists of five Vite SPAs that each partially re-implement framework primitives, plus an Express backend (`showcase-backend`) that pre-dates the shared local-runtime control-plane direction around `@cfxdevkit/devnode-server`. Once the new Next.js apps and the shared local runtime are live and verified, these old apps are pure dead weight. This change removes them cleanly.

## Goals / Non-Goals

**Goals:**
- All five old Vite app directories are deleted
- `apps/showcase-backend/` is deleted only after its remaining logic is covered by the shared local-runtime control plane consumed by `showcase-local`
- The old `packages/showcase-ui/` is deleted (rebuilt in `examples-shared-foundation`)
- `projects/examples/.moon/workspace.yml` and `pnpm-workspace.yaml` updated to remove all old references
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

- **Dangling cross-references**: If any `package.json` anywhere in the monorepo depends on `@cfxdevkit/example-showcase-ui` (old) by the old package name, the install will break. → Mitigation: `grep -r "showcase-ui"` before deletion to find all references.
- **Moon task graph**: Moon may cache task references for deleted projects. → Mitigation: run `moon clean` after removal to clear task cache.

## Migration Plan

1. Confirm new apps are fully working (`pnpm build` passes for both)
2. `grep -r` for references to old package names across the monorepo
3. Delete old app/package directories
4. Update `.moon/workspace.yml` and `pnpm-workspace.yaml`
5. Run `pnpm install` from monorepo root
6. Run `pnpm run check:hotspots` and `tsc` on affected packages
7. Run `moon clean` to clear cached task graph
