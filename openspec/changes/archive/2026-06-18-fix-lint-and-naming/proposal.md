## Why

The repository's quality gates are currently failing due to two lint errors and a kebab-case naming warning. These issues block CI pipelines and reduce code consistency. Resolving them now ensures all checks pass and maintains a clean, standardized codebase.

## What Changes

- Fix `noAssignInExpressions` lint error in `llm-agents/src/wiki-validate.ts` by refactoring the assignment out of the expression.
- Remove unused `StatusReport` type and fix formatting diffs in `pi-agent`.
- Rename 5 group identifiers across `tooling-cli`, `arch-check`, `llm-agents`, `pi-agent`, and `cfx-ui` to comply with kebab-case naming conventions.

## Capabilities

### New Capabilities
- `fix-lint-and-naming`: Addresses lint errors and enforces kebab-case naming standards across multiple packages to restore CI quality gates.

### Modified Capabilities
- None

## Impact

- **Affected Code**: `llm-agents/src/wiki-validate.ts`, `pi-agent` source files, and group definitions in `tooling-cli`, `arch-check`, `llm-agents`, `pi-agent`, and `cfx-ui`.
- **Systems**: CI/CD quality gates (`pnpm run lint`, `pnpm run check`).
- **Dependencies**: None. Internal codebase consistency improvements only.
