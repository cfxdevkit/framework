# precheck-build-gate Specification

## Purpose

Make the Moon build task a first-class, default-on, blocking gate in the precommit quality sequence — symmetric with typecheck and tests.

## Requirements

### Requirement: Build gate SHALL run by default in the precommit quality sequence

`runQualityGates` SHALL include the build gate when no flags are passed. `withBuild` SHALL default to `true`.

#### Scenario: Precommit runs build without any flag
- **WHEN** `cdk repo precommit` is called without `--skip-build`
- **THEN** `runRepoCommand('build', [])` SHALL execute as part of the quality gates (delegated through `@cfxdevkit/cdk-repo-check`)

#### Scenario: Build gate is skipped with --skip-build
- **WHEN** `cdk repo precommit --skip-build` is called
- **THEN** the build gate SHALL be omitted from the quality gate sequence

---

### Requirement: A failing build SHALL block the precommit

The build gate's `required` flag SHALL be `true`. A non-zero exit from Moon build SHALL set gate status `error` and prevent a successful precommit result.

#### Scenario: Build failure blocks precommit
- **WHEN** `runRepoCommand('build', [])` returns status `'error'`
- **THEN** the precommit SHALL report `status: 'blocked'` and the blockedBy reason SHALL include the build gate failure

#### Scenario: Build success does not block
- **WHEN** `runRepoCommand('build', [])` returns status `'ok'`
- **THEN** the build gate result SHALL be `status: 'ok'` and the sequence SHALL continue

---

### Requirement: `build` SHALL be registered in `cdk-repo-check` `validationStepDefinitions`

`RepoValidationStepId` SHALL include `'build'`. `validationStepDefinitions` SHALL list `build` after `test`. `runValidationStep` and `renderValidationCommand` SHALL handle `'build'`. This is the canonical source — `QUALITY_GATE_SPECS` in `llm-agents` references the same target.

---

### Requirement: The `--skip-build` and `--with-build` flags SHALL be symmetric

`flags.ts` SHALL recognise `--skip-build` (sets `withBuild: false`) and retain `--with-build` (no-op since default is now `true`) for backwards compatibility.

#### Scenario: --skip-build disables the build gate
- **WHEN** `--skip-build` is passed to `cdk repo precommit` or `cdk repo commit`
- **THEN** `flags.withBuild` SHALL be `false` and the build gate SHALL be filtered out

#### Scenario: --with-build is a no-op when already the default
- **WHEN** `--with-build` is passed
- **THEN** behaviour SHALL be identical to not passing the flag

---

### Requirement: Commit post-generation quality re-check SHALL NOT include the build gate

The post-generation quality gate pass in `commit.ts` SHALL keep `withBuild: false` to preserve a short feedback loop after generated file writes.

#### Scenario: Post-generation check skips build
- **WHEN** the commit workflow runs the post-generation quality re-check
- **THEN** the build gate SHALL not execute in that phase

---

### Requirement: Gate order documentation SHALL reflect the build step

The precommit workflow note, repo-system prompt, and repo-actions skill SHALL all document the gate sequence as: `gitnexus analyze → format → lint → typecheck → tests → build → hotspots → kebab-groups → repo check`.

#### Scenario: Help output shows correct gate order
- **WHEN** a maintainer reads the precommit workflow note or help text
- **THEN** `build` SHALL appear between `tests` and `hotspots` in the documented sequence
