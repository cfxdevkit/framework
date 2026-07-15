## Why

The `pi-agent` package currently fails CI validation due to outdated test expectations missing required `approvalMode` and `modelPolicies` fields, and the `kebab-groups` linter flags non-kebab-case filenames in `src/commands`. These failures block merges, introduce false negatives in the validation pipeline, and increase developer context switching by scattering related command files. Resolving them restores CI health, enforces consistent package organization, and ensures the test suite accurately reflects current runtime behavior.

## What Changes

- Update `pi-agent` test fixtures and assertions to include the missing `approvalMode: "defer"` and `modelPolicies` structure in expected outputs.
- Rename `repo*.ts` files in `pi-agent/src/commands` to kebab-case (e.g., `repo-actions.ts`, `repo-check.ts`, `repo-commit.ts`, `repo-run.ts`, `repo-status.ts`) to satisfy the `kebab-groups` lint rule.
- Update all internal imports, exports, and references across the `pi-agent` package to reflect the new kebab-case filenames.
- Verify that `pi-agent:test` and `kebab-groups` checks pass without warnings or errors, restoring the validation pipeline to a healthy state.

## Capabilities

### New Capabilities
- `fix-pi-agent-tests-and-naming`: Aligns `pi-agent` test expectations with current runtime output and enforces kebab-case naming conventions for command files to improve package organization and CI compliance.

### Modified Capabilities
- None

## Impact

- **Code:** `pi-agent/src/commands/` (file renames and grouping), `pi-agent/src/commands/__tests__/` (test fixtures and assertions), and all internal import/export statements within the package.
- **Tests/CI:** `pi-agent:test` validation step, `kebab-groups` lint check.
- **Dependencies:** No external dependency changes; purely internal structural and test expectation updates.
- **Systems:** `pi-agent` package build, test, and validation pipeline.
