## Why

Hard hotspots in four core files—`repo-namespace.ts`, `agent-namespace.ts`, `repo-namespace.test.ts`, and `check.ts`—exceed defined thresholds for line count and complexity scores, blocking CI checks and degrading maintainability. These files are large, monolithic, and tightly coupled, making them difficult to test, review, and extend. Splitting them into smaller, focused modules is necessary to restore compliance with quality gates and prevent further technical debt accumulation.

## What Changes

- Introduce a new capability `hotspot-remediation` to define and enforce structured remediation workflows for hard hotspots.
- Split `repo-namespace.ts` into modular files (e.g., `repo-namespace/definition.ts`, `repo-namespace/operations.ts`, `repo-namespace/validation.ts`).
- Split `agent-namespace.ts` into focused modules (e.g., `agent-namespace/types.ts`, `agent-namespace/registry.ts`, `agent-namespace/execution.ts`).
- Refactor `repo-namespace.test.ts` into targeted test modules (e.g., `repo-namespace/__tests__/definition.test.ts`, `repo-namespace/__tests__/operations.test.ts`).
- Decompose `check.ts` into composable checkers (e.g., `check/hotspots.ts`, `check/kebab-groups.ts`, `check/lint.ts`, `check/types.ts`).
- Update import paths across the codebase to reflect new module structure.
- **BREAKING**: Public exports previously in monolithic files will be reorganized; consumers must update imports to use new module paths.

## Capabilities

### New Capabilities
- `hotspot-remediation`: Defines the policy, tooling, and validation rules for identifying, prioritizing, and remediating hard hotspots via modular decomposition. Includes thresholds, remediation workflows, and verification checks.

### Modified Capabilities
None.

## Impact

- **Code**: All files listed in hotspots (error) will be refactored; ~2,769 total lines across 4 files will be reorganized.
- **Imports**: All internal imports referencing the old monolithic files must be updated to point to new modules.
- **Tests**: Test coverage must be preserved or improved during decomposition; test files will be reorganized to match new module structure.
- **CI/CD**: The `cdk repo check hotspots` command will continue to validate hotspot compliance, now with support for modularized files.
- **Dependencies**: No external dependencies affected; only internal module structure changes.
