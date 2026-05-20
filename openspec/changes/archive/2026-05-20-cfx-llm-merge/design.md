## Context

The monorepo contains three internal automation packages under `repos/cfx-llm/packages/`:
- `@cfxdevkit/llm-client` — generic LLM provider abstraction (zero cfxdevkit runtime deps)
- `@cfxdevkit/llm-agents` — commit pipeline, review, docs-upkeep agents (depends on llm-client + arch-check)
- `@cfxdevkit/llm-tools` — CLI dispatcher that spawns agent workers (depends on llm-agents + llm-client)

All three are Tier 1 (platform), internal-only, never published to npm. `repos/cfx-tools/` is the home of all other Tier 1 developer platform packages. Keeping a separate `cfx-llm` repo adds topology overhead (workspace glob, moon entries, arch-rules entry) for what is effectively internal tooling.

## Goals / Non-Goals

**Goals:**
- Move `llm-client`, `llm-agents`, `llm-tools` into `repos/cfx-tools/infra/`
- Update all workspace configuration files so pnpm + moon continue to resolve them correctly
- Remove the now-empty `repos/cfx-llm/` skeleton
- Keep all `@cfxdevkit/llm-*` npm package names and `workspace:*` dependency references unchanged

**Non-Goals:**
- Refactoring llm-agents internal structure (generic vs cfxdevkit layer split — Phase 4 item)
- Publishing any of these packages
- Moving `arch-check` out of `packages/` into `infra/` (separate decision)

## Decisions

### D1: Target path `repos/cfx-tools/infra/`
`infra/` signals "repo automation, not user-facing tooling". It is distinct from `packages/` (user-installable) and `devtools/` / `templates/`. The directory name is intentional — future extraction to an independent monorepo would start here.

### D2: New pnpm workspace glob `repos/cfx-tools/infra/*`
`pnpm-workspace.yaml` currently matches `repos/*/packages/*`. `infra/` is a sibling, not under `packages/`, so an explicit glob line is needed. Alternative (using a `packages/infra/` sub-folder under cfx-tools) was rejected because it would make `infra/` appear to be a package itself in some tooling.

### D3: Use `git mv` to preserve history
All three directories should be moved with `git mv` to keep blame and history intact.

### D4: arch-rules.yaml update
Remove `repos/cfx-llm/packages/**` from the `platform` tier paths. The `repos/cfx-tools/infra/**` glob is added. No tier change — still Tier 1 platform.

### D5: cfx-llm repo skeleton cleanup
After moving packages, `repos/cfx-llm/` will be empty (or contain only a README + package.json). The directory is removed. `pnpm-workspace.yaml` currently has `repos/*/packages/*` which would match an empty directory safely — no change needed for pnpm.

## Risks / Trade-offs

- Rebuild required for `@cfxdevkit/llm-agents` after the move (dist/ references old paths in sourcemaps only — not a runtime issue)
- `llm-tools/workers/lemonade/cli.ts` uses a relative `findRepoRoot` scan that is path-agnostic — unaffected by the move
- Any IDE path bookmarks or absolute references in docs will need updating
