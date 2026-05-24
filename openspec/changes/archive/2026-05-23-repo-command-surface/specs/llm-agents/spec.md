## MODIFIED Requirements

### Requirement: `build` SHALL be in `cdk-repo-check` `validationStepDefinitions`

**MODIFIED** — `build` is now in `QUALITY_GATES` (llm-agents), but the canonical step registry is `validationStepDefinitions` in `cdk-repo-check`. Both must agree.

**Updated requirement text:**

`RepoValidationStepId` SHALL include `'build'`. `validationStepDefinitions` SHALL contain a `build` entry with `kind: 'command'` and `required: true`. `runValidationStep` SHALL handle `'build'` by calling `runStructuredRepoCommand('build', [])`. `renderValidationCommand` SHALL return `'pnpm run build'` for `'build'`.

#### Scenario: `cdk repo check validation` runs build by default
- **WHEN** `cdk repo check validation` is invoked without step filtering
- **THEN** the `build` step SHALL execute after `test` in the validation sequence

#### Scenario: `cdk repo check validation --steps typecheck,lint` skips build
- **WHEN** a selected-steps filter that excludes `build` is used
- **THEN** the `build` step SHALL be skipped

## ADDED Requirements

### Requirement: `gates.ts` SHALL consume `runRepoCommand` for quality gate execution

`llm-agents/commit/gates.ts` SHALL NOT call `execFileAsync('pnpm', ...)` directly for quality gates. It SHALL call `runRepoCommand(target, [])` from `@cfxdevkit/cdk-repo-check` and map `RepoCommandResult` to `GateResult`.

#### Scenario: Quality gate result maps from RepoCommandResult
- **WHEN** a quality gate executes
- **THEN** `GateResult.elapsedMs` SHALL come from `RepoCommandResult.summary.durationMs`, `GateResult.status` from `RepoCommandResult.status`, and `GateResult.output` from the `stdoutTail` + `stderrTail`

#### Scenario: Policy gates use runRepoCheck for hotspots and kebab-groups
- **WHEN** the hotspots policy gate executes
- **THEN** it SHALL call `runRepoCheck('hotspots', ['--fail-on-hard'])` and map the result

### Requirement: `QUALITY_GATE_SPECS` SHALL be metadata-only; execution delegated to `cdk-repo-check`

The `QUALITY_GATES` array in `llm-agents/workers/shared/index.ts` SHALL be renamed to `QUALITY_GATE_SPECS` and contain only: `id`, `target` (`RepoCommandTarget`), `required`, and `timeoutMs`. The `cmd` and `args` fields SHALL be removed.

#### Scenario: Metadata-only spec drives gate configuration
- **WHEN** a gate is configured
- **THEN** `id`, `required`, and `timeoutMs` come from `QUALITY_GATE_SPECS`; execution comes from `runRepoCommand(spec.target)`
