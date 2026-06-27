## Why

The repository validation is currently failing with 5 errors across `tooling-cli`, `cli`, and `llm-agents` packages, blocking development and CI pipelines. This change resolves lint violations, typecheck failures due to unused variables, build errors from missing exports, and a hard hotspot violation in `keystore.ts` to restore the repo check to a passing state.

## What Changes

- Organize imports and exports in `tooling-cli` to resolve lint errors.
- Remove unused variable `iFK` in `cli/src/commands/keystore.ts` to resolve TS6133 typecheck error.
- Export `repoCheckCommand` from `llm-agents/workers/agents/check/types.ts` to resolve build failure.
- Refactor `cli/src/commands/keystore.ts` to reduce file size and complexity, resolving the hard hotspot error (590 lines).

## Capabilities

### New Capabilities
- `cli-tooling-repo-check-fixes`: Fixes lint, typecheck, build, and hotspot errors in CLI, tooling, and LLM agents packages to restore repository validation health.

### Modified Capabilities
None

## Impact

- `tooling-cli`: Import organization and export structure.
- `cli`: `src/commands/keystore.ts` modified to remove unused variable and reduce complexity.
- `llm-agents`: `workers/agents/check/types.ts` modified to add `repoCheckCommand` export.
- Repository validation checks (`lint`, `typecheck`, `build`, `check`) will pass.
