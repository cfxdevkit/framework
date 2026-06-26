## Why

The `pi-agent` package is currently failing CI validation due to a test snapshot mismatch caused by an unexpected `approvalMode` field in the test output. Additionally, the `src/commands` directory contains files prefixed with `repo` that violate the repository's kebab-case naming convention, triggering persistent warnings. Resolving these issues is necessary to restore CI health, ensure test reliability, and maintain consistent codebase standards.

## What Changes

- Update `pi-agent` test snapshots to explicitly include the `approvalMode: "defer"` field, aligning test expectations with current runtime behavior.
- Rename `repo*.ts` files in `pi-agent/src/commands` to follow kebab-case conventions (e.g., `repo-actions.ts`, `repo-check.ts`, `repo-commit.ts`, `repo-run.ts`, `repo-status.ts`) to eliminate naming convention warnings.
- Group these updates within a single change context to ensure atomic validation and consistent package state.

## Capabilities

### New Capabilities
- `pi-agent-test-and-naming-fix`: Synchronizes test snapshots with updated runtime output and enforces kebab-case naming conventions for command modules in the pi-agent package.

### Modified Capabilities
- None

## Impact

- **Code:** `pi-agent/src/commands/` (file renames), `pi-agent/test/` (snapshot updates)
- **CI/Validation:** Resolves `test (error)` and `kebab-groups (warning)` checks in the validation pipeline
- **Dependencies:** No external dependency changes; purely internal test and naming adjustments
