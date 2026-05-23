## Why

Four files exceed the recommended complexity thresholds for hard hotspots, with repo-namespace.ts alone reaching 632 lines and a score of 1444—well above the acceptable limit. This violates OpenSpec’s modularity constraint and increases cognitive load, test fragility, and risk of merge conflicts. Addressing this now prevents further entrenchment of technical debt and ensures alignment with the project’s maintainability standards.

## What Changes

- **BREAKING**: Split `repo-namespace.ts` into focused modules: `repo-namespace/core.ts`, `repo-namespace/queries.ts`, and `repo-namespace/validation.ts`.
- **BREAKING**: Split `agent-namespace.ts` into `agent-namespace/core.ts` and `agent-namespace/execution.ts`.
- **BREAKING**: Refactor `repo-namespace.test.ts` into targeted test modules mirroring the new source structure.
- **BREAKING**: Decompose `check.ts` into `check/runner.ts`, `check/validators.ts`, and `check/reporting.ts`.
- Remove monolithic namespace files from their current locations.
- Introduce `specs/refactor-hard-hotspots/spec.md` to codify the new modularity and complexity thresholds.

## Capabilities

### New Capabilities
- `refactor-hard-hotspots`: Defines modularity constraints for source files, including hard/soft hotspot thresholds, file size and complexity limits, and structural guidelines for splitting monolithic modules.

### Modified Capabilities
None.

## Impact

- **Affected code**: `repo-namespace.ts`, `agent-namespace.ts`, `repo-namespace.test.ts`, `check.ts`, and their imports across the codebase.
- **APIs**: Public exports from the above modules will be reorganized; consumers must update import paths.
- **Dependencies**: Any tooling or scripts that assume the old file structure (e.g., build hooks, linter rules, CI checks) must be updated.
- **Systems**: IDE navigation, test runners, and static analysis tools may require configuration updates to recognize the new module layout.
