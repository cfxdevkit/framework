## Why

The `cdk repo` command tree has two separate execution paths: a structured JSON layer (`@cfxdevkit/cdk-repo-check`) that wraps every step in a typed `RepoStructuredResult` envelope, and a raw-spawn bypass used by `repo-namespace.ts` for `check/generate/arch-check` and by `llm-agents/gates.ts` for the entire precommit quality sequence. The bypass routes produce unstructured terminal output, cannot be consumed programmatically, and duplicate execution logic across three call sites. As `cdk agent chat` and a future VSCode extension need to invoke the same steps and get machine-readable results, the bypass must be eliminated and a single execution contract established.

## What Changes

- **`@cfxdevkit/cdk-repo-check`** — add `build` to the validation step sequence (`RepoValidationStepId`, `validationStepDefinitions`, `runValidationStep`, `renderValidationCommand`); this is the canonical step registry.
- **`tooling-cli` `repo-namespace.ts`** — rewire `cdk repo check *`, `cdk repo generate *`, and `cdk repo arch-check` to go through `runRepoCheck` / `runRepoCommand` from `repo-check-runtime`; retire the `runRootScript` bypass for these paths; add `cdk repo run <target>` as a direct command entry point.
- **`llm-agents` `gates.ts`** — replace `QUALITY_GATES` raw pnpm execution with calls to `runRepoCommand` from `cdk-repo-check`; map `RepoCommandResult` → `GateResult` so the gate HUD and failure analysis stay unchanged.
- **Presentation contract** — define `RepoResultRenderer` in `cdk-repo-check`: `renderText(result)` for terminal output, `renderJson(result)` for `--json` piping, `renderCompact(result)` for agent context injection; the CLI, agent chat, and future VSCode extension each pick their renderer.

## Capabilities

### New Capabilities
- `repo-command-surface`: Formal surface definition — every `cdk repo` sub-command routes through `runRepoCheck` / `runRepoCommand`; `cdk repo run <target>` exposes the full `RepoCommandTarget` set; all outputs are `RepoStructuredResult`.
- `repo-result-renderer`: Thin presentation contract over `RepoStructuredResult` — `renderText`, `renderJson`, `renderCompact`; consumed by CLI, agent context builders, and future UI clients.

### Modified Capabilities
- `precheck-build-gate`: `build` is now registered in `cdk-repo-check`'s `validationStepDefinitions` — the canonical step registry — not only in `llm-agents/QUALITY_GATES`.
- `llm-agents`: `gates.ts` consumes `runRepoCommand` instead of raw pnpm; `QUALITY_GATES` step list derives from or delegates to `cdk-repo-check` types.

## Impact

- `repos/cfx-tools/packages/cdk-repo-check/src/repo-check/types.ts` — `RepoValidationStepId` union gains `'build'`.
- `repos/cfx-tools/packages/cdk-repo-check/src/repo-check/validation.ts` — `validationStepDefinitions` gains `build`; `runValidationStep` and `renderValidationCommand` handle it; new `renderText`/`renderJson`/`renderCompact` exports.
- `repos/cfx-tools/infra/tooling-cli/src/repo-namespace.ts` — `repoCheckScriptMap` and `repoGenerateScriptMap` branches replaced by `runRepoCheck`/`runRepoCommand` calls; `cdk repo run <target>` added.
- `repos/cfx-tools/infra/llm-agents/workers/commit/gates.ts` — `runQualityGate` uses `runRepoCommand`; `runRepositoryPolicyGate` uses `runRepoCheck`.
- `repos/cfx-tools/infra/llm-agents/workers/shared/index.ts` — `QUALITY_GATES` step list either removed or reduced to flag/timeout metadata only; execution delegates to `cdk-repo-check`.
