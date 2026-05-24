# Tasks — repo-command-surface

Implementation order: foundation (`cdk-repo-check` types + renderer) → consumers (CLI + gates) → validation + spec promotion.

## Phase 1 — Foundation: canonical step registry in `cdk-repo-check`

- [x] **1.1** Add `'build'` to `RepoValidationStepId` union in `cdk-repo-check/src/repo-check/types.ts`
- [x] **1.2** Add `build` entry to `validationStepDefinitions`, `runValidationStep`, and `renderValidationCommand` in `cdk-repo-check/src/repo-check/validation.ts`

## Phase 2 — Presentation contract: `RepoResultRenderer`

- [x] **2.1** Create `cdk-repo-check/src/repo-check/renderer.ts` with `RepoResultRenderer` interface and `defaultRenderer` implementation (`renderText`, `renderJson`, `renderCompact`)
- [x] **2.2** Export `defaultRenderer` and `RepoResultRenderer` from `cdk-repo-check/src/index.ts`

## Phase 3 — Wire `cdk repo` namespace through structured layer

- [x] **3.1** Rewire `cdk repo check docs/ci/secrets/corpus/eval` through `runRepoCommand` in `tooling-cli/src/repo-namespace.ts`; parse `--json` flag; use `defaultRenderer`
- [x] **3.2** Rewire `cdk repo generate api/readme/structure/unit-configs` through `runRepoCommand`
- [x] **3.3** Rewire `cdk repo arch-check` through `runRepoCommand('arch-check')`
- [x] **3.4** Add `cdk repo run <target> [--json]` command that accepts any `RepoCommandTarget`

## Phase 4 — Migrate `llm-agents` gates to consume `cdk-repo-check`

- [x] **4.1** Replace `QUALITY_GATES` with metadata-only `QUALITY_GATE_SPECS` in `llm-agents/workers/shared/index.ts`; update all imports
- [x] **4.2** Rewrite `runQualityGate` in `gates.ts` to call `runRepoCommand` and map `RepoCommandResult` → `GateResult`
- [x] **4.3** Rewrite `runRepositoryPolicyGate` in `gates.ts` to call `runRepoCheck` / `runRepoCommand` for hotspots, kebab-groups, and check

## Phase 5 — Validate and promote specs

- [x] **5.1** Confirm `build` step appears in `cdk repo check validation --json` output
- [x] **5.2** Confirm `cdk repo run lint --json` produces valid `RepoCommandResult` JSON
- [x] **5.3** Promote `repo-command-surface` and `repo-result-renderer` specs to global registry
- [x] **5.4** Apply delta to `openspec/specs/precheck-build-gate/spec.md` and `openspec/specs/llm-agents/spec.md`
