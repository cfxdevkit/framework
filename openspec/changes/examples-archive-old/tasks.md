## 1. Pre-deletion verification

- [ ] 1.1 Confirm `pnpm --filter @cfxdevkit/example-showcase-public build` passes
- [ ] 1.2 Confirm `pnpm --filter @cfxdevkit/example-showcase-local build` passes
- [ ] 1.3 Run `grep -r "showcase/\|showcase-stack\|showcase-browser\|hardware-wallet-showcase\|showcase-gateway\|showcase-backend" projects/examples --include="*.json" --include="*.yaml" --include="*.yml"` and resolve any remaining cross-references
- [ ] 1.4 Run `grep -r "from.*showcase-ui\|require.*showcase-ui" projects/ repos/ --include="*.ts" --include="*.tsx"` to confirm no external dependencies on the old package name

## 2. Delete old app directories

- [ ] 2.1 Delete `projects/examples/apps/showcase/`
- [ ] 2.2 Delete `projects/examples/apps/showcase-stack/`
- [ ] 2.3 Delete `projects/examples/apps/showcase-browser/`
- [ ] 2.4 Delete `projects/examples/apps/hardware-wallet-showcase/`
- [ ] 2.5 Delete `projects/examples/apps/showcase-gateway/`
- [ ] 2.6 Delete `projects/examples/apps/showcase-backend/`

## 3. Update workspace configuration

- [ ] 3.1 Update `projects/examples/pnpm-workspace.yaml`: remove globs for all deleted apps, keep only `apps/showcase-public`, `apps/showcase-local`, `packages/showcase-ui`
- [ ] 3.2 Update `projects/examples/.moon/workspace.yml` (if present): remove project entries for all deleted apps
- [ ] 3.3 Update root `.moon/workspace.yml` (if it lists examples sub-projects explicitly): remove deleted app entries

## 4. Post-deletion verification

- [ ] 4.1 Run `pnpm install` from monorepo root — confirm no unresolved dependency errors
- [ ] 4.2 Run `moon clean` to clear task cache
- [ ] 4.3 Run `pnpm run check:hotspots` — confirm no violations
- [ ] 4.4 Run `pnpm --filter @cfxdevkit/example-showcase-public build` — still passes
- [ ] 4.5 Run `pnpm --filter @cfxdevkit/example-showcase-local build` — still passes
