# repo-command-surface Specification

## Purpose

Every `cdk repo` sub-command that invokes a build step, check, or generation task SHALL route through `runRepoCheck` or `runRepoCommand` from `@cfxdevkit/cdk-repo-check`. No call site outside `cdk-repo-check` SHALL spawn pnpm directly for these operations.

## Requirements

### Requirement: `cdk repo check *` SHALL route through the structured layer

All `cdk repo check <target>` invocations SHALL call `runRepoCheck(target, args)` or `runRepoCommand(target, args)` from `@cfxdevkit/cdk-repo-check` — not `runRootScript`.

#### Scenario: `cdk repo check docs` returns structured result
- **WHEN** `cdk repo check docs` is run
- **THEN** the command SHALL call `runRepoCommand('check-docs', args)` and output a `RepoCommandResult`

#### Scenario: `cdk repo check validation` still works
- **WHEN** `cdk repo check validation` is run
- **THEN** the command SHALL call `runRepoCheck('validation', args)` as before; behaviour is unchanged

---

### Requirement: `cdk repo generate *` SHALL route through the structured layer

All `cdk repo generate <target>` invocations SHALL call `runRepoCommand(target, args)` and produce a `RepoCommandResult`.

#### Scenario: `cdk repo generate api` returns structured result
- **WHEN** `cdk repo generate api` is run
- **THEN** the command SHALL call `runRepoCommand('generate-api', args)` and output a `RepoCommandResult`

---

### Requirement: `cdk repo arch-check` SHALL route through the structured layer

`cdk repo arch-check` SHALL call `runRepoCommand('arch-check', args)` and produce a `RepoCommandResult`.

#### Scenario: arch-check uses structured execution
- **WHEN** `cdk repo arch-check` is run
- **THEN** the command SHALL call `runRepoCommand('arch-check', args)`; raw spawn SHALL NOT be used

---

### Requirement: `cdk repo run <target>` SHALL expose the full `RepoCommandTarget` set

A new `cdk repo run <target> [args]` command SHALL accept any valid `RepoCommandTarget` and call `runRepoCommand(target, args)`.

#### Scenario: Direct command invocation
- **WHEN** `cdk repo run lint` is run
- **THEN** the command SHALL call `runRepoCommand('lint', [])` and output the result

#### Scenario: Unknown target is rejected
- **WHEN** `cdk repo run unknown-target` is run
- **THEN** the command SHALL exit non-zero with a message listing valid `RepoCommandTarget` values

---

### Requirement: All `cdk repo` step commands SHALL accept `--json`

Every `cdk repo check *`, `cdk repo generate *`, `cdk repo run *`, and `cdk repo arch-check` SHALL accept `--json` and output `JSON.stringify(result, null, 2)` when the flag is present.

#### Scenario: JSON output for programmatic consumers
- **WHEN** `cdk repo check hotspots --json` is run
- **THEN** stdout SHALL be a valid JSON string matching `RepoCheckHotspotsResult`

#### Scenario: Default output is human-readable text
- **WHEN** `cdk repo run lint` is run without `--json`
- **THEN** stdout SHALL be the `renderText(result)` human-readable representation

---

### Requirement: `RepoCommandTarget` SHALL include all needed step targets

`@cfxdevkit/cdk-repo-check` `RepoCommandTarget` SHALL cover: `gitnexus-analyze`, `build`, `test`, `lint`, `typecheck`, `format`, `format-check`, `check-unused`, `security-audit`, `security-check`, `check-docs`, `check-ci`, `check-secrets`, `check-corpus`, `check-eval`, `generate-api`, `generate-readme`, `generate-structure`, `generate-unit-configs`, `arch-check`. *(Already satisfied — requirement is a standing contract that additions go here first.)*

#### Scenario: New step target is registered before CLI wiring
- **WHEN** a new pnpm script needs to be exposed through `cdk repo`
- **THEN** it SHALL be added to `repoCommandDefinitions` in `cdk-repo-check/types.ts` first, before any CLI or gate code references it
