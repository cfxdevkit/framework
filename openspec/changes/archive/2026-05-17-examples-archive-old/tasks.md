> Closure note (2026-05-17): Archive this change as deferred, not implemented. The old apps and their root config registrations still exist, and the ports described in `artifacts/plan/phase-2-showcase-public.md` are not finished yet. This checklist was aligned to the real surfaces, but it was not validated as complete work.

## 1. Pre-deletion verification

- [ ] 1.1 Confirm `pnpm --filter @cfxdevkit/example-showcase-public build` passes
- [ ] 1.2 Confirm `pnpm --filter @cfxdevkit/example-showcase-local build` passes
- [ ] 1.3 Run `grep -r "showcase/\|showcase-stack\|showcase-browser\|hardware-wallet-showcase\|showcase-gateway\|showcase-backend" projects/examples --include="*.json" --include="*.yaml" --include="*.yml"` and resolve any remaining cross-references
- [ ] 1.4 Search the workspace for docs/config references to the legacy example app names and update any remaining pointers before deletion

## 2. Delete old app directories

- [ ] 2.1 Delete `projects/examples/apps/showcase/`
- [ ] 2.2 Delete `projects/examples/apps/showcase-stack/`
- [ ] 2.3 Delete `projects/examples/apps/showcase-browser/`
- [ ] 2.4 Delete `projects/examples/apps/hardware-wallet-showcase/`
- [ ] 2.5 Delete `projects/examples/apps/showcase-gateway/`
- [ ] 2.6 Delete `projects/examples/apps/showcase-backend/`

## 3. Update workspace configuration

- [ ] 3.1 Update root `pnpm-workspace.yaml`: remove entries/globs for all deleted apps, keep the keeper apps and `projects/examples/packages/showcase-ui`
- [ ] 3.2 Update root `.moon/workspace.yml`: remove deleted app entries if they are listed explicitly
- [ ] 3.3 Update any example README/structure docs that still list the deleted apps as active

## 4. Post-deletion verification

- [ ] 4.1 Run `pnpm install` from monorepo root — confirm no unresolved dependency errors
- [ ] 4.2 Run `moon clean` to clear task cache
- [ ] 4.3 Run `pnpm run check:hotspots` — confirm no violations
- [ ] 4.4 Run `pnpm --filter @cfxdevkit/example-showcase-public build` — still passes
- [ ] 4.5 Run `pnpm --filter @cfxdevkit/example-showcase-local build` — still passes
