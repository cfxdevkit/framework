## Why

The `pi-agent` module currently fails CI lint checks due to a missing/misplaced `StatusReport` type import and a suspicious assignment-in-expression pattern in `src/wiki-validate.ts`. These lint violations block the pipeline, reduce code quality, and introduce potential runtime type errors. Resolving them now restores the lint pass rate and enforces consistent formatting and type safety across the agent codebase.

## What Changes

- Correct the import statement for `StatusReport` in `pi-agent` source files to resolve the missing/misplaced type error.
- Refactor the assignment-in-expression pattern in `src/wiki-validate.ts` to comply with the `lint/suspicious/noAssignInExpressions` rule.
- Apply consistent code formatting to eliminate the formatting diff reported by the linter.

## Capabilities

### New Capabilities
- `fix-lint-pi-agent-imports`: Resolves lint failures in the `pi-agent` module by correcting type imports, fixing suspicious expression patterns, and enforcing formatting standards.

### Modified Capabilities
- None

## Impact

Affects `pi-agent` source files, specifically type definitions and `src/wiki-validate.ts`. Restores the CI lint pipeline to a passing state. No external APIs, dependencies, or system behaviors are modified.
