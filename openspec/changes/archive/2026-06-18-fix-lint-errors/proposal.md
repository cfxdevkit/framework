## Why

Hard lint failures in `llm-agents` and `pi-agent` are blocking the precommit pipeline and repo-check validation. Resolving these violations is necessary to restore CI/CD pipeline health and maintain enforced code quality standards across the repository.

## What Changes

- Refactor `src/wiki-validate.ts` in `llm-agents` to remove the assignment within an expression, resolving the `noAssignInExpressions` lint error.
- Correct the import/export mismatch in `pi-agent` to align module boundaries and satisfy the linter.
- Ensure `pnpm run lint` passes without errors, unblocking the precommit hook and validation checks.

## Capabilities

### New Capabilities
- `fix-lint-errors`: Addresses specific lint rule violations (`noAssignInExpressions`, `import/export mismatch`) in `llm-agents` and `pi-agent` to unblock the precommit pipeline.

### Modified Capabilities
- None

## Impact

- Affected code: `llm-agents/src/wiki-validate.ts`, `pi-agent` source files.
- Systems: Precommit pipeline, repo-check validation, CI/CD linting stage.
- Dependencies: None.
