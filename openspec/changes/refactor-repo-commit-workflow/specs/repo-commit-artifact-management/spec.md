## ADDED Requirements

### Requirement: Commit report written to .pi directory
The `writeCommitReport` function SHALL write `llm-commit.md` to `.pi/artifacts/llm/reports/llm-commit.md` instead of `artifacts/llm/reports/llm-commit.md`. The `.pi/artifacts/llm/reports/` directory SHALL be created lazily if it does not exist.

#### Scenario: Report written to .pi directory
- **WHEN** `writeCommitReport` is called with a commit response
- **THEN** the report file is written to `.pi/artifacts/llm/reports/llm-commit.md`

#### Scenario: Directory created if missing
- **WHEN** `.pi/artifacts/llm/reports/` does not exist
- **THEN** it is created (including parent directories) before writing

#### Scenario: Report content unchanged
- **WHEN** `writeCommitReport` is called
- **THEN** the report content (subject, body, changeset plan) is identical to the previous `artifacts/llm/reports/llm-commit.md` format

### Requirement: Generated files tracked before post-checks
The `runCommitWorkflow` function SHALL track all generated files (reports, changesets) in a list and include them in the staging set before post-generation validation runs.

#### Scenario: Report file added to staging
- **WHEN** `writeCommitReport` writes to `.pi/artifacts/llm/reports/llm-commit.md`
- **THEN** the file path is added to the `generatedFiles` list

#### Scenario: Changeset files added to staging
- **WHEN** `writeChangesetFile` writes changeset files
- **THEN** each written file path is added to the `generatedFiles` list

#### Scenario: Staging set includes all generated files
- **WHEN** `resolveFilesToStage` is called before post-checks
- **THEN** the staging set includes both user-visible changes and generated files

### Requirement: Post-checks validation ignores .pi/ directory
Post-generation validation (`runValidationCheck` with post-checks) SHALL NOT scan `.pi/` for file changes. Files in `.pi/` SHALL be excluded from the `assertNoUnexpectedChanges` check.

#### Scenario: .pi/ files not flagged as unexpected
- **WHEN** `assertNoUnexpectedChanges` runs
- **THEN** files in `.pi/` are not compared against the expected changeset

#### Scenario: Workspace files still validated
- **WHEN** `assertNoUnexpectedChanges` runs
- **THEN** files outside `.pi/` are still validated for unexpected modifications

### Requirement: Re-runs do not fail due to leftover artifacts
A second invocation of `runCommitWorkflow` (or `/repo-commit`) SHALL NOT fail validation because files created by the first run (reports, changesets) are present in the workspace.

#### Scenario: First run succeeds
- **WHEN** `runCommitWorkflow` runs successfully
- **THEN** artifacts are written to `.pi/artifacts/llm/reports/` and changeset files

#### Scenario: Second run succeeds
- **WHEN** `runCommitWorkflow` runs a second time without manual cleanup
- **THEN** it passes validation (no false "unexpected changes" from `.pi/` files or already-committed changesets)

#### Scenario: Aborted run leaves no artifacts
- **WHEN** `runCommitWorkflow` is aborted mid-way
- **THEN** no report files or changesets are written to the workspace

## REMOVED Requirements

### Requirement: Commit report written to artifacts/ directory
**Reason**: `artifacts/` is a workspace directory scanned by validation. Writing there causes false positives on re-runs.
**Migration**: All report files now go to `.pi/artifacts/`.

### Requirement: Generated files not included in pre-check validation
**Reason**: Previously, generated files were not staged before post-checks, causing "unexpected changes" failures.
**Migration**: Generated files are tracked and included in the staging set before `assertNoUnexpectedChanges` runs.
