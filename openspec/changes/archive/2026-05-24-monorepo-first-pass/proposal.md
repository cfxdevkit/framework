## Why

The monorepo analysis (`.ideas/monorepo-analysis.md`) identified four first-pass items that are low-risk, high-value, and achievable in a single session: marking archived packages private to prevent accidental publish, registering three packages that have `moon.yml` but are invisible to the build graph, extracting the duplicated `findWorkspaceRoot`/`findRepoRoot` function into one canonical implementation, and moving `cfx-tools`-specific test helpers out of `cfx-core/packages/testing`.

## What Changes

- **C4 — Archive packages private**: Add `"private": true` to `cdk-ai` and `llm-tools` archived package.json files.
- **C3 — Moon workspace registration**: Add `docs-pipeline`, `docs-site`, and `pi-agent` to `.moon/workspace.yml`; add `pi-agent:build` as a dep of `tooling-cli:build`.
- **C1 — `@cfxdevkit/workspace-utils`**: New package in `cfx-config/packages/workspace-utils` with a single canonical `findWorkspaceRoot(startDir?)` + `getWorkspaceRoot()` (cached singleton). Replace all 6 duplicate implementations across `arch-check`, `cdk-repo-check`, `docs-pipeline`, `tooling-cli`, and `pi-agent`.
- **C2 — Relocate test support**: Move `tooling-cli-test-support.ts` from `cfx-core/packages/testing` into `cfx-tools/infra/tooling-cli/src/test-support.ts`; move `llm-agents-test-support.ts` into `cfx-tools/infra/llm-agents/workers/tests/support.ts`. Update imports. Remove the sub-path exports from `@cfxdevkit/testing`.

## Capabilities

### New Capabilities
- `workspace-utils`: canonical `findWorkspaceRoot` used by all cfx-tools packages.

### Modified Capabilities
- `arch-check`, `cdk-repo-check`, `docs-pipeline`, `tooling-cli`, `pi-agent`: import from `@cfxdevkit/workspace-utils` instead of local copy.
- `testing`: removes cfx-tools-internal sub-paths; stays as public testing utility for cfx-core consumers only.

## Impact

- `repos/cfx-tools/packages/archive/cdk-ai/package.json` — `private: true`
- `repos/cfx-tools/infra/archive/llm-tools/package.json` — `private: true`
- `.moon/workspace.yml` — add 3 entries
- `repos/cfx-tools/infra/tooling-cli/moon.yml` — add `pi-agent:build` dep
- `repos/cfx-config/packages/workspace-utils/` — new package
- `repos/cfx-tools/packages/arch-check/src/runtime.ts` — use workspace-utils
- `repos/cfx-tools/packages/arch-check/src/checks/monorepo-units.ts` — use workspace-utils
- `repos/cfx-tools/packages/cdk-repo-check/src/repo-check/context.ts` — use workspace-utils
- `repos/cfx-tools/packages/docs-pipeline/src/workspace.ts` — use workspace-utils
- `repos/cfx-tools/infra/tooling-cli/src/workspace-paths.ts` — use workspace-utils
- `repos/cfx-tools/infra/pi-agent/src/runtime.ts` — use workspace-utils
- `repos/cfx-core/packages/testing/src/index.ts` — remove sub-path exports
- `repos/cfx-core/packages/testing/package.json` — remove sub-path exports
- `repos/cfx-tools/infra/tooling-cli/src/test-support.ts` — new file (moved from testing)
- `repos/cfx-tools/infra/llm-agents/workers/tests/support.ts` — new/updated file
