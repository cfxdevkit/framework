## Why

The monorepo has a well-documented four-tier architecture (`ARCHITECTURE.md`) but no machine-readable form of those rules and no tooling to enforce them. As the codebase grows through porting, merging, and LLM-assisted generation, violations accumulate silently — there is currently no CI gate that would catch a T0 package importing T1 tooling, a missing `moon.yml`, or a `// @ts-nocheck` in a framework file.

## What Changes

- **New repo `repos/cfx-config/`** — holds the three build-config packages currently in `tools/` (`@cfxdevkit/tsconfig`, `@cfxdevkit/biome-config`, `@cfxdevkit/moon-config`). Establishes a clean cross-cutting tier (-1) alongside `repos/cfx-meta/`.
- **New package `repos/cfx-meta/packages/arch-rules/`** — exports a parsed, typed representation of `arch-rules.yaml` as `@cfxdevkit/arch-rules`. Any tool in the workspace can import the tier graph without hardcoding paths.
- **New file `repos/cfx-meta/arch-rules.yaml`** — machine-readable source of truth for all architectural rules. Replaces the prose in `ARCHITECTURE.md` as the authoritative definition; `ARCHITECTURE.md` becomes derived documentation.
- `repos/cfx-meta/` gets a `packages/` directory and is wired into `pnpm-workspace.yaml` and `.moon/workspace.yml`.
- `repos/cfx-config/` is created and wired into `pnpm-workspace.yaml` and `.moon/workspace.yml`.
- `tools/tsconfig/`, `tools/biome-config/`, `tools/moon-config/` are moved to `repos/cfx-config/packages/`. All 35 consumer `devDependencies` references remain identical (same package names).
- `tools/` directory is removed from the repo root.
- `ARCHITECTURE.md` updated to reference `arch-rules.yaml` as the authoritative source.

## Capabilities

### New Capabilities

- `arch-rules`: Machine-readable architectural rules YAML (`arch-rules.yaml`) and typed TypeScript package (`@cfxdevkit/arch-rules`) that exposes the tier graph, rule set, and lifecycle state for consumption by validation tooling and LLM context generation.
- `cfx-config-repo`: The `repos/cfx-config/` logical sub-repo holding build-configuration packages (`@cfxdevkit/tsconfig`, `@cfxdevkit/biome-config`, `@cfxdevkit/moon-config`) as a dedicated cross-cutting tier, separate from platform tooling.

### Modified Capabilities

_(none — no existing spec-level behavior is changing)_

## Impact

- **`pnpm-workspace.yaml`**: two new glob patterns (`repos/cfx-meta/packages/*`, `repos/cfx-config/packages/*`); `tools/*` pattern removed.
- **`.moon/workspace.yml`**: entries for tsconfig, biome-config, moon-config updated from `tools/*` to `repos/cfx-config/packages/*`; arch-rules entry added.
- **All 35 packages** that devDepend on `@cfxdevkit/tsconfig`, `@cfxdevkit/biome-config`, or `@cfxdevkit/moon-config`: package names unchanged, only physical paths move. No source code changes required.
- **`ARCHITECTURE.md`**: prose tier table updated; cross-cutting tier section added for cfx-meta and cfx-config.
- **`tools/STRUCTURE.md`, `tools/README.md`**: deleted with the directory.
- No runtime code is affected. All moved packages are `"private": true` dev-only configuration.
