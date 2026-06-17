## Why

The precommit quality gate is blocked by lint errors in `llm-agents` and `pi-agent`, halting the development workflow and risking code quality regression. This change resolves a `noAssignInExpressions` violation in `wiki-validate.ts` and a stale format/type mismatch in `pi-agent` to restore the pipeline to a passing state and unblock merges.

## What Changes

- Refactor `llm-agents/src/wiki-validate.ts` to remove the assignment within an expression, satisfying the `noAssignInExpressions` lint rule.
- Correct the stale format and type mismatch in `pi-agent` regarding `RunGenerateOptions` and `StatusReport`.
- Verify that `pnpm run lint` passes for both affected packages, ensuring the precommit hook executes successfully.

## Capabilities

### New Capabilities
- `remediate-lint-errors`: Remediation of lint violations and type/format mismatches in `llm-agents` and `pi-agent` to ensure compliance with the project's quality gate requirements.

### Modified Capabilities
- None

## Impact

- **Affected Code**: `llm-agents/src/wiki-validate.ts`, `pi-agent` type definitions and formatting.
- **Systems**: Precommit hooks, CI lint validation pipeline.
- **Dependencies**: None.
