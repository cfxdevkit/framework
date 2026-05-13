## Context

`repos/cfx-llm/packages/llm-tools` currently contains two conceptually distinct subsystems under one package:

1. **Deterministic repo-health checks** — code hotspot analysis (`workers/code-hotspots.ts`), secret-leak scanning (currently `scripts/check-secret-leaks.mjs`), and repo-upkeep validation workers (`workers/agents/cicd.ts`, `docs.ts`, `corpus.ts`, `eval-serve.ts`). These make no LLM calls; they are pure file-system and git operations.

2. **LLM-agent orchestration** — `workers/llm-agents.ts`, `workers/lemonade/`, `workers/agents/review.ts`, commit/changeset helpers. These are the true LLM surface.

Both subsystems are routed through the same `llm` CLI binary and exposed via `llm:*` root scripts, blurring the architectural boundary. Every `llm:ci`, `llm:corpus`, `llm:docs`, `llm:eval` invocation today spins up the full `llm-tools` binary just to run filesystem checks.

An `arch:check` task also doesn't exist anywhere — tier-boundary and layout validation is either manual or not done at all.

## Goals / Non-Goals

**Goals:**
- Create `@cfxdevkit/arch-check` in `repos/cfx-tools/packages/arch-check/` as a proper Tier-1 platform package
- Port `workers/code-hotspots.ts` and `scripts/check-secret-leaks.mjs` into `arch-check` as typed TypeScript (removing `@ts-nocheck`)
- Move the deterministic agent runners (`cicd`, `docs`, `corpus`, `eval`) from `llm-tools` into `arch-check`; remove them from the `llm-tools` dispatch table
- Implement `arch:check` as the first consumer of `@cfxdevkit/arch-rules`, validating tier boundaries and layout rules
- Update root `package.json` so deterministic checks use `check:*` prefix, LLM-specific commands keep `llm:*` prefix
- Register `arch-check` in `pnpm-workspace.yaml` and `.moon/workspace.yml`
- Delete `scripts/check-secret-leaks.mjs`

**Non-Goals:**
- Eliminating `@ts-nocheck` from the LLM/Lemonade workers in `llm-tools` (that is Change 5)
- Changing the LLM-agent logic itself (`llm:commit`, `llm:review`, `llm:ask`, etc.)
- Publishing `arch-check` to npm
- Adding new arch rules beyond those already in `arch-rules.yaml`

## Decisions

### D1: arch-check lives in cfx-tools (Tier 1), not cfx-meta (Tier -1)

**Decision:** `repos/cfx-tools/packages/arch-check/` — Tier 1 platform package.

**Rationale:** `arch-check` contains runtime TypeScript logic (file scanning, git queries, rule evaluation). Cross-cutting packages in Tier -1 (`cfx-meta`, `cfx-config`) are devDependency-only config/schema packages with no source to build. `arch-check` is a proper TypeScript library with build output and moon tasks, fitting squarely in the dev-platform tier alongside `scaffold-cli`, `cli`, `mcp-server`.

**Alternative considered:** Putting it in `cfx-meta` alongside `arch-rules` — rejected because `arch-rules` is a pure data/type package while `arch-check` has complex logic and would then need to import `cfx-tools` packages, creating a circular dependency risk.

---

### D2: Deterministic agent runners are fully moved to arch-check, not delegated

**Decision:** `workers/agents/cicd.ts`, `docs.ts`, `corpus.ts`, `eval-serve.ts` and their `runtime/` helpers are **moved** into `arch-check/src/checks/`, not kept in `llm-tools` as thin wrappers. The corresponding commands (`ci`, `corpus`, `docs`, `eval`, `serve-check`) are removed from `llm-tools`' dispatch table.

**Rationale:** A thin wrapper still couples `llm-tools` to the check logic, preventing independent versioning and testing of `arch-check`. Removing the commands from the `llm-tools` dispatch is a clean cut; the root `package.json` aliases handle backward compat for developers' muscle memory by keeping `check:ci` etc. alongside the `llm:*` namespace.

**Alternative considered:** Keep wrappers in `llm-tools` that `import` from `arch-check` — rejected because it adds an inter-package runtime dependency between two platform packages. `arch-check` would then need to be a runtime dependency of `llm-tools`, complicating the dependency graph.

---

### D3: `arch:check` validates `enforce: always` rules only for now

**Decision:** The initial `arch:check` implementation evaluates all rules with `enforce: always` and `severity: error`. Rules with `enforce: on-release` are skipped until `lifecycle` transitions to `release`.

**Rationale:** Matches the lifecycle semantics already defined in `arch-rules.yaml`. Running `on-release` rules as errors against a `pre-release` codebase would produce noise (e.g., `platform-uses-semver-for-framework` would fail immediately since all deps use `workspace:*`). The `@cfxdevkit/arch-rules` `getLifecycle()` helper makes this conditional clean.

---

### D4: Root script naming convention: `check:*` for deterministic, `llm:*` for LLM

**Decision:**
- `quality:hotspots` → `check:hotspots`
- `security:secrets` → `check:secrets`  
- `llm:ci`, `llm:docs`, `llm:corpus`, `llm:eval`, `llm:hotspots` → removed (replaced by `check:ci`, `check:docs`, `check:corpus`, `check:eval`, `check:hotspots`)
- `security:check` updated to call `check:secrets`
- New script `arch:check` added
- `llm:commit`, `llm:review`, `llm:ask`, `llm:changeset`, `llm:docs-upkeep`, etc. — unchanged

**Rationale:** The naming makes the dependency on an LLM explicit. `check:*` scripts can run in bare CI without any LLM server configured. `llm:*` scripts require a running Lemonade/Pi instance.

---

### D5: `code-hotspots.ts` and `check-secret-leaks.mjs` are rewritten in typed TypeScript

**Decision:** Both are ported into `arch-check/src/checks/` as `hotspots.ts` and `secrets.ts` with full TypeScript types — no `@ts-nocheck`.

**Rationale:** `code-hotspots.ts` already has `// @ts-nocheck` only because it lives in a `workers/` directory not covered by the `arch-check` tsconfig. The logic is straightforward; the types are easy to add. `check-secret-leaks.mjs` is plain Node.js with no complex types — trivial to port. This is consistent with the `arch:check` rule `no-ts-nocheck` in `arch-rules.yaml`.

---

## Risks / Trade-offs

**[Risk] cicd.ts references `scripts/publish-packages.mjs` as a required file** — The current `cicd` agent checks for `scripts/publish-packages.mjs`. If `scripts/` is eventually cleaned up, this required-file list in the ported `check:ci` will also need updating. Mitigation: port the check as-is; log a TODO comment in the code; address in a separate cleanup change.

**[Risk] Removing `llm:ci`, `llm:docs`, `llm:corpus`, `llm:eval` from root scripts breaks existing CI YAML** — Any `.github/workflows/*.yml` that calls `pnpm run llm:ci` will fail. Mitigation: audit all workflow files before removing the aliases and add backward-compat aliases (`llm:ci → check:ci`) temporarily if needed.

**[Risk] `check:corpus` writes to `artifacts/llm/`** — The corpus agent builds metadata files under `artifacts/llm/corpus/`. This path lives outside `arch-check` package boundaries. Mitigation: keep the output path configuration as-is; the working-directory convention of running from repo root does not change.

## Migration Plan

1. Create `arch-check` package scaffold
2. Port `check-secret-leaks.mjs` → `src/checks/secrets.ts`
3. Port `workers/code-hotspots.ts` → `src/checks/hotspots.ts`
4. Move deterministic agent runners from `llm-tools` → `arch-check/src/checks/`
5. Implement `arch:check` using `@cfxdevkit/arch-rules`
6. Wire moon tasks in `moon.yml`
7. Remove migrated workers from `llm-tools`; remove their dispatch entries from `llm-agents.ts`
8. Update root `package.json` scripts
9. Delete `scripts/check-secret-leaks.mjs`
10. Register `arch-check` in workspace + moon
11. Verify: `moon run arch-check:arch:check` exits 0; `moon run arch-check:check:secrets` exits 0

**Rollback:** All changes are additive until step 7 (worker deletion). Git revert of step 7-9 restores previous state fully.

## Open Questions

- _(none — all decisions made)_
