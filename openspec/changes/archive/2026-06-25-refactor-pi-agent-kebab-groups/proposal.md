## Why

The `pi-agent/src/commands` directory contains 5 files matching the `repo*.ts` pattern that trigger a `kebab-groups` warning during validation. This fragmentation violates the repository's kebab-case module grouping standards, causing the `repo-check` linting to fail. Consolidating these files into properly named kebab-case modules resolves the warning and improves module cohesion.

## What Changes

- Refactor `pi-agent/src/commands` to group 5 `repo*.ts` files into kebab-case modules.
- Update file names and internal imports to satisfy the `kebab-groups` linting rule.
- Resolve the `repo-check` warning for `pi-agent/src/commands`.

## Capabilities

### New Capabilities
- `refactor-pi-agent-kebab-groups`: Refactor pi-agent command files to adhere to kebab-case naming and grouping standards.

### Modified Capabilities
None

## Impact

- `pi-agent/src/commands/repo-actions.ts`
- `pi-agent/src/commands/repo-check.ts`
- `pi-agent/src/commands/repo-commit.ts`
- `pi-agent/src/commands/repo-run.ts`
- `pi-agent/src/commands/repo-status.ts`
- Internal imports within `pi-agent` referencing these command files.
- `repo-check` validation status.
