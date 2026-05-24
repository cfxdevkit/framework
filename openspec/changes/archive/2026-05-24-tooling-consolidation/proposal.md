## Why

Five packages in `cfx-tools` (`arch-check`, `cdk-ai`, `cdk-repo-check`, `llm-agents`, `llm-tools`) have accumulated fragmentation across three sessions of incremental work: duplicated command registries, a spawn-based dispatcher that reimplements what tooling-cli does in-process, a barrel package whose only job is a build-signal side-effect, a wildcard re-export that exposes every internal symbol, and hardcoded script contracts that drift from the CLI every time a command is renamed. The `.ideas/arch-llm-refactor.md` analysis identifies six phases to address all of this.

## What Changes

- **P6 — Moon layer declarations**: `arch-check`, `cdk-ai`, `cdk-repo-check` change `layer: 'application'` → `layer: 'library'` in their `moon.yml` files.
- **P4 — Narrow `cdk-repo-check` re-export**: Replace `export * from '@cfxdevkit/arch-check'` with an explicit named re-export list; consumers that relied on the wildcard now import from `@cfxdevkit/arch-check` directly.
- **P1 — Eliminate `llm-tools`**: Replace `docs-namespace.ts` spawn-through-llmToolingNamespace calls with direct `withLlmAgents()` calls; remove `llm-tools` from the moon workspace and archive the package.
- **P2 — Eliminate `cdk-ai`**: Update `agent-runtime.ts` to use `llm-agents/dist/index.js` as the build signal; update all dynamic imports to use `@cfxdevkit/llm-agents` / `@cfxdevkit/pi-agent` specifiers; remove `cdk-ai` from workspace and archive.
- **P3 — Static imports in `tooling-cli`**: Convert `repo-check-runtime.ts` from runtime dynamic loading + path detection to static `import` from `@cfxdevkit/cdk-repo-check`; simplify `agent-runtime.ts` pi-agent loading.
- **P5 — Derive script contracts from command registry**: Replace hardcoded `workspace-scripts-llm.ts` and `workspace-scripts-repo.ts` entries with a `validateToolingScripts(commandDefs)` approach driven by `tooling-cli`'s exported command definitions.

## Capabilities

### New Capabilities
- `tooling-script-contract-validation`: `arch-check` validates workspace scripts against the tooling-cli command registry, not a hardcoded list.

### Modified Capabilities
- `repo-command-surface`: `cdk-repo-check` explicit re-exports only; no wildcard.
- `llm-agents`: no longer depends on `cdk-ai` indirection; consumers import directly.
- `agent-commit-runtime`: `cdk agent` commands route in-process; no subprocess spawning for doc enrichment.

## Impact

- `repos/cfx-tools/packages/arch-check/moon.yml` — layer: library
- `repos/cfx-tools/packages/cdk-ai/moon.yml` — layer: library (before archive)
- `repos/cfx-tools/packages/cdk-repo-check/moon.yml` — layer: library
- `repos/cfx-tools/packages/cdk-repo-check/src/index.ts` — explicit named exports
- `repos/cfx-tools/infra/tooling-cli/src/docs-namespace.ts` — direct withLlmAgents calls
- `repos/cfx-tools/infra/tooling-cli/src/agent-runtime.ts` — new build signal, updated imports
- `repos/cfx-tools/infra/tooling-cli/src/repo-check-runtime.ts` — static import
- `repos/cfx-tools/infra/tooling-cli/package.json` — add llm-agents + pi-agent as deps; remove llm-tools + cdk-ai
- `repos/cfx-tools/packages/arch-check/src/contracts/workspace-scripts-llm.ts` — replaced by derived validation
- `.moon/workspace.yml` — remove llm-tools and cdk-ai entries
- `repos/cfx-tools/infra/llm-tools/` — archived
- `repos/cfx-tools/packages/cdk-ai/` — archived
