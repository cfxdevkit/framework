# Tasks — tooling-consolidation

## P6 — Moon layer declarations

- [x] **P6.1** `arch-check/moon.yml`: change `layer: 'application'` → `layer: 'library'`
- [x] **P6.2** `cdk-repo-check/moon.yml`: change `layer: 'application'` → `layer: 'library'`
- [x] **P6.3** `cdk-ai/moon.yml`: change `layer: 'application'` → `layer: 'library'` (before archive)

## P4 — Narrow cdk-repo-check re-export

- [x] **P4.1** Audit which symbols from `@cfxdevkit/arch-check` are actually used by external consumers via `cdk-repo-check`
- [x] **P4.2** Replace `export * from '@cfxdevkit/arch-check'` in `cdk-repo-check/src/index.ts` with explicit named exports
- [x] **P4.3** Typecheck confirms no consumers break; any that do are updated to import from `@cfxdevkit/arch-check` directly

## P1 — Eliminate llm-tools

- [x] **P1.1** Audit all consumers of `@cfxdevkit/llm-tools` outside of llm-tools itself
- [x] **P1.2** Rewrite `docs-namespace.ts` enrichment handlers to use `withLlmAgents(...)` directly (remove `llmToolingNamespace.run()` calls)
- [x] **P1.3** Remove `@cfxdevkit/llm-tools` from `tooling-cli/package.json` dependencies
- [x] **P1.4** Remove `repos/cfx-tools/infra/llm-tools` from `.moon/workspace.yml`
- [x] **P1.5** Typecheck + tests pass without llm-tools
- [x] **P1.6** Archive `repos/cfx-tools/infra/llm-tools` → `repos/cfx-tools/infra/archive/llm-tools`

## P2 — Eliminate cdk-ai

- [x] **P2.1** Update `agent-runtime.ts` `hasBuiltCdkAiRuntime()` to drop `cdkAiDistEntry` check; keep `piAgentDistEntry` + `llmAgentsDistEntry`
- [x] **P2.2** Update `agent-runtime.ts` `withLlmClient`, `withLlmAgents`, `withPiAgent` dynamic imports to use `@cfxdevkit/llm-agents` / `@cfxdevkit/pi-agent` specifiers instead of `@cfxdevkit/cdk-ai`
- [x] **P2.3** Add `@cfxdevkit/llm-agents` and `@cfxdevkit/pi-agent` as direct dependencies of `tooling-cli`; remove `@cfxdevkit/cdk-ai`
- [x] **P2.4** Remove `repos/cfx-tools/packages/cdk-ai` from `.moon/workspace.yml`
- [x] **P2.5** Typecheck + tests pass without cdk-ai
- [x] **P2.6** Archive `repos/cfx-tools/packages/cdk-ai` → `repos/cfx-tools/packages/archive/cdk-ai`

## P3 — Static imports in tooling-cli

- [x] **P3.1** Add `@cfxdevkit/cdk-repo-check` as a direct (non-dynamic) dependency of `tooling-cli`
- [x] **P3.2** Rewrite `repo-check-runtime.ts` as a thin re-export of `@cfxdevkit/cdk-repo-check` static imports; remove all `loadRepoCheckModule`, `findRepoRoot`, `pathToFileURL`, `existsSync` logic
- [x] **P3.3** Update `repo-namespace.ts` imports if the shim types change
- [x] **P3.4** Typecheck + `cdk repo build` works with static import

## P5 — Derive script contracts from command registry

- [x] **P5.1** Add `getRootScriptRequirements(): ScriptRequirement[]` export to `tooling-cli/src/index.ts` that builds entries from `repoActions`, `agentCommands`, and `repoCommands`
- [x] **P5.2** Update `arch-check/src/contracts/workspace-scripts.ts` to call the new export (via dynamic import) instead of the hardcoded files
- [x] **P5.3** Delete `arch-check/src/contracts/workspace-scripts-llm.ts` (entries now derived)
- [x] **P5.4** Confirm `pnpm cdk repo arch-check` and `pnpm run check:docs` still pass
- [x] **P5.5** Typecheck + hotspot check pass

## Validate and promote

- [x] **V.1** `pnpm run build` passes (concurrency 3)
- [x] **V.2** `pnpm cdk -- repo precommit --skip-tests` passes all gates
- [x] **V.3** `cdk repo check validation --json` shows correct step sequence
- [x] **V.4** `cdk docs enrich api --dry-run` or `cdk agent deterministic docs-api` executes without spawning subprocess
- [x] **V.5** Promote `tooling-consolidation` spec to `openspec/specs/`
