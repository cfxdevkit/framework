## Context

The monorepo currently has three build-config packages (`@cfxdevkit/tsconfig`, `@cfxdevkit/biome-config`, `@cfxdevkit/moon-config`) living in a root-level `tools/` directory, outside the `repos/cfx-*` sub-repo convention used everywhere else. Architectural rules are documented in prose (`ARCHITECTURE.md`) with no machine-readable form. There is no `@cfxdevkit/arch-rules` package and no `arch-rules.yaml` file.

Two repos that will own permanent cross-cutting artifacts are already stub-present:
- `repos/cfx-meta/` — exists with README and CHANGELOG only, no `packages/` directory
- `repos/cfx-config/` — does not yet exist

Consumers of the build-config packages span all 35 workspace packages (T0 through T3). Their `devDependency` references use the same package names that will persist after the move.

## Goals / Non-Goals

**Goals:**
- Create `repos/cfx-config/packages/` with tsconfig, biome-config, moon-config migrated from `tools/`
- Create `repos/cfx-meta/packages/arch-rules/` with `@cfxdevkit/arch-rules` package
- Create `repos/cfx-meta/arch-rules.yaml` as the authoritative rule definition
- Wire both new repos into `pnpm-workspace.yaml` and `.moon/workspace.yml`
- Delete `tools/` from the repo root
- Update `ARCHITECTURE.md` to reference the new structure

**Non-Goals:**
- Building the `arch-check` validator tool (Change 3)
- Migrating `scripts/` at the repo root (Change 3)
- Splitting `cfx-llm` (Change 5)
- Enforcing any rules via CI (that is Change 3's job)
- Publishing any packages to npm

## Decisions

### D1: arch-rules.yaml lives in `repos/cfx-meta/`, not the repo root

**Decision:** `repos/cfx-meta/arch-rules.yaml`

**Rationale:** cfx-meta is defined as the home for architecture artifacts. Placing it at the repo root would re-clutter the root we're trying to clean. The `@cfxdevkit/arch-rules` package in `repos/cfx-meta/packages/arch-rules/` exports a parsed form, so consumers import from the package rather than loading a path-relative YAML file directly.

**Alternative considered:** Repo root (`/arch-rules.yaml`) — rejected because it adds another root file and splits ownership between the root and cfx-meta.

---

### D2: `@cfxdevkit/arch-rules` exports a typed parsed object, not raw YAML

**Decision:** The package reads `arch-rules.yaml` at build time via Vite's `?raw` or JSON import, parses it, and exports typed constants and helper functions (`getTierFor(path)`, `getRulesFor(tierId)`, `getLifecycle()`).

**Rationale:** Consumers (the future `arch-check` tool, LLM context generators) need typed access. Requiring them to each parse the YAML independently would scatter YAML parsing logic and coupling to the file path. The package is the single parse boundary.

**Alternative considered:** Export the raw YAML string and let consumers parse — rejected because it distributes the schema coupling.

---

### D3: Cross-cutting tier uses level -1 in arch-rules.yaml

**Decision:** Both `repos/cfx-meta` and `repos/cfx-config` are assigned `level: -1` with a `cross-cutting: true` flag. The rule for cross-cutting packages: they may appear in `devDependencies` of any tier; they must never appear in `dependencies` (runtime) of any tier.

**Rationale:** Level -1 cleanly expresses "below the bottom of the tier stack" without a special named category. The `cross-cutting` flag lets validators apply the devDependency-only rule without needing to enumerate both repos by name.

**Alternative considered:** Level 0 with a `buildOnly: true` flag — rejected because level 0 is already occupied by framework packages, causing ambiguity in range comparisons.

---

### D4: Build-config packages do not gain moon task graphs in this change

**Decision:** `@cfxdevkit/tsconfig`, `@cfxdevkit/biome-config`, `@cfxdevkit/moon-config` retain their current minimal `moon.yml` definitions (or none). No `build`, `test`, or `typecheck` tasks are added in this change.

**Rationale:** These packages contain only static JSON/YAML config files with no TypeScript source to build or test. Adding empty moon tasks would create false signals in the task graph.

**Alternative considered:** Add a `check` task that validates JSON schema — deferred to a future improvement, not needed for the foundation.

---

### D5: `tools/codegen/` directory is deleted without replacement in this change

**Decision:** `tools/codegen/` contains only two README-only convention stubs (`wagmi/`, `api-types/`). The live code (`@cfxdevkit/codegen-contracts`) is already in `repos/cfx-solidity/packages/contracts-extract/`. The `tools/codegen/` directory is deleted; the pointer in its README is already accurate.

**Rationale:** No live code is lost. The convention docs for wagmi and api-types can move to `repos/cfx-solidity/docs/` in a future change if needed.

---

### D6: `arch-rules.yaml` lifecycle starts as `pre-release`

**Decision:** The initial `lifecycle: pre-release` value means rules with `enforce: on-release` emit warnings only, not errors. The `workspace:*` dependency rule for T1 packages is `on-release`; it will not block CI until the lifecycle is changed to `release`.

**Rationale:** No packages have been published to npm yet. Enforcing semver range requirements before any release exists would be noise. The lifecycle field exists specifically to make this transition explicit and auditable.

## Risks / Trade-offs

**[Risk] 35 packages need path-reference updates in tsconfig.json** → `tsconfig.json` files in all consumer packages use `"extends": "../../tools/tsconfig/lib.json"` style relative paths, which will break when `tools/` is deleted. Mitigation: the migration task includes a workspace-wide search-and-replace from `tools/tsconfig/` to `repos/cfx-config/packages/tsconfig/` relative paths, and verification via `tsc --noEmit` across all packages before committing.

**[Risk] biome.json root-extends path** → The root `biome.json` may extend `tools/biome-config/biome.json`. Mitigation: update root biome.json as part of the migration.

**[Risk] moon-config template references** → `moon.yml` files that use `toolchain.node` or import from `tools/moon-config/templates/` will need path updates. Mitigation: search for all references to `tools/moon-config` and update to `repos/cfx-config/packages/moon-config`.

**[Risk] arch-rules.yaml schema drift from ARCHITECTURE.md** → If someone updates `ARCHITECTURE.md` without updating `arch-rules.yaml`, they diverge. Mitigation: `ARCHITECTURE.md` is explicitly marked as derived; a note at the top directs editors to `arch-rules.yaml` as the source of truth. Enforcement via arch-check is deferred to Change 3.

## Migration Plan

1. Create `repos/cfx-config/` directory structure with root `package.json`, `pnpm-workspace.template.yaml`, `README.md`, `CHANGELOG.md`
2. Copy `tools/tsconfig/`, `tools/biome-config/`, `tools/moon-config/` into `repos/cfx-config/packages/`
3. Update `pnpm-workspace.yaml` to add `repos/cfx-config/packages/*` and `repos/cfx-meta/packages/*`, remove `tools/*`
4. Update `.moon/workspace.yml` project entries
5. Update all `tsconfig.json` `extends` path references workspace-wide
6. Update root `biome.json` extends path
7. Create `repos/cfx-meta/packages/arch-rules/` package
8. Create `repos/cfx-meta/arch-rules.yaml`
9. Delete `tools/` directory
10. Update `ARCHITECTURE.md`
11. Run `pnpm install` to verify lockfile; run `tsc --noEmit` and `biome check` across workspace

**Rollback:** The change is a file rename/move with no npm publishes. Git revert restores the previous state fully.

## Open Questions

- _(none — all decisions made during explore phase)_
