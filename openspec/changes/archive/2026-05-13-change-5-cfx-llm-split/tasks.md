## 1. llm-client — Package Scaffold

- [x] 1.1 Create `repos/cfx-llm/packages/llm-client/package.json` (`@cfxdevkit/llm-client`, private: false, ESM, same devDeps as llm-tools)
- [x] 1.2 Create `repos/cfx-llm/packages/llm-client/tsconfig.json` (extends `@cfxdevkit/tsconfig`)
- [x] 1.3 Create `repos/cfx-llm/packages/llm-client/vite.config.ts` (mirrors llm-tools vite.config)
- [x] 1.4 Create `repos/cfx-llm/packages/llm-client/biome.json` (extends `@cfxdevkit/biome-config`)
- [x] 1.5 Create `repos/cfx-llm/packages/llm-client/moon.yml` with `build`, `typecheck`, `lint`, `test` tasks
- [x] 1.6 Register `llm-client` in `.moon/workspace.yml` and `repos/cfx-llm/pnpm-workspace.template.yaml`
- [x] 1.7 Add `repos/cfx-llm/packages/llm-client` to `pnpm-workspace.yaml`
- [x] 1.8 Create `repos/cfx-llm/packages/llm-client/src/` and `workers/` directory structure

## 2. llm-client — Provider Layer

- [x] 2.1 Copy `workers/lemonade/shared/` into `llm-client/workers/shared/`; remove `@ts-nocheck`; add explicit types to all exported symbols
- [x] 2.2 Copy `workers/lemonade/completion/json.ts` and `completion/runner.ts` into `llm-client/workers/completion/`; remove `@ts-nocheck`; add explicit types
- [x] 2.3 Copy `workers/lemonade/completion/client.ts` into `llm-client/workers/completion/`; remove `@ts-nocheck`; add explicit types (`discoverModels`, `createClient`, `chooseModel`, `readConfig`, `writeConfig`, `defaultConfig`)
- [x] 2.4 Copy `workers/lemonade/completion/complete.ts` and `complete-utils.ts` into `llm-client/workers/completion/`; remove `@ts-nocheck`; add explicit types
- [x] 2.5 Copy `workers/lemonade/completion/context.ts` into `llm-client/workers/completion/`; remove `@ts-nocheck`; add explicit types
- [x] 2.6 Copy `workers/lemonade/completion/direct.ts` into `llm-client/workers/completion/`; remove `@ts-nocheck`; add explicit types
- [x] 2.6b Delete `workers/lemonade/completion/pi.ts` and `pi-rpc.ts` from `llm-tools` (not ported); remove `@mariozechner/pi-coding-agent` from `llm-tools/package.json`
- [x] 2.7 Create `llm-client/workers/completion/index.ts` barrel that re-exports all public symbols (no `@ts-nocheck`)
- [x] 2.8 Define `LlmProvider` interface and `ChatMessage`, `CompletionOptions`, `LlmModel` types in `llm-client/src/types.ts`
- [x] 2.9 Implement `LemonadeProvider` class in `llm-client/src/lemonade.ts` implementing `LlmProvider`
- [x] 2.10 Implement `OpenAICompatProvider` class in `llm-client/src/openai-compat.ts` implementing `LlmProvider`; read `OPENAI_BASE_URL` and `OPENAI_API_KEY` from env; `discoverModels()` returns `[]`
- [x] 2.12 Implement `GitHubModelsProvider` class in `llm-client/src/github-models.ts` implementing `LlmProvider`; endpoint `https://models.inference.ai.azure.com`; bearer auth via `GITHUB_TOKEN`; default model `gpt-4o-mini` (override via `GITHUB_MODEL` env or config)
- [x] 2.13 Implement `resolveProvider(): Promise<LlmProvider>` in `llm-client/src/resolve.ts` following the 6-step priority chain: (1) config baseUrl, (2) `LEMONADE_URL`/`LEMONADE_BASE_URL` env, (3) local probe, (4) `OPENAI_BASE_URL`+`OPENAI_API_KEY`, (5) `GITHUB_TOKEN`, (6) throw `LlmProviderNotFoundError` with diagnostics
- [x] 2.14 Implement `createProvider(type, config?)` factory in `llm-client/src/factory.ts` covering `'lemonade' | 'openai-compat' | 'github-models'`
- [x] 2.15 Create `llm-client/src/index.ts` barrel exporting `LlmProvider`, `LlmModel`, `ChatMessage`, `CompletionOptions`, `LlmProviderNotFoundError`, `createProvider`, `resolveProvider`, `LemonadeProvider`, `OpenAICompatProvider`, `GitHubModelsProvider`, and config helpers
- [x] 2.16 Run `tsc --noEmit` on `llm-client`; fix all type errors

## 3. llm-agents — Package Scaffold

- [x] 3.1 Create `repos/cfx-llm/packages/llm-agents/package.json` (`@cfxdevkit/llm-agents`, private: false, ESM, depends on `@cfxdevkit/llm-client` and `@cfxdevkit/arch-check`)
- [x] 3.2 Create `repos/cfx-llm/packages/llm-agents/tsconfig.json`, `vite.config.ts`, `biome.json`, `moon.yml`
- [x] 3.3 Register `llm-agents` in `.moon/workspace.yml`, `repos/cfx-llm/pnpm-workspace.template.yaml`, and `pnpm-workspace.yaml`

## 4. llm-agents — Agent Layer

- [x] 4.1 Copy `workers/agents/runtime/` into `llm-agents/workers/agents/runtime/`; remove `@ts-nocheck`; add explicit types for all exported symbols
- [x] 4.2 Copy `workers/agents/review.ts` and `all.ts` into `llm-agents/workers/agents/`; remove `@ts-nocheck`; replace direct lemonade imports with `LlmProvider` parameter injection
- [x] 4.3 Copy `workers/lemonade/commit/` into `llm-agents/workers/commit/`; remove `@ts-nocheck`; replace `completion/` imports with `@cfxdevkit/llm-client`; add explicit types
- [x] 4.4 Copy `workers/lemonade/docs/` into `llm-agents/workers/docs/`; remove `@ts-nocheck`; replace `completion/` imports with `@cfxdevkit/llm-client`; add explicit types
- [x] 4.5 Copy `workers/lemonade/tests/` into `llm-agents/workers/tests/`; remove `@ts-nocheck`; replace `completion/` imports with `@cfxdevkit/llm-client`; add explicit types
- [x] 4.6 Copy `workers/lemonade/shared/` usage (repoActions, QUALITY_GATES) into `llm-agents/workers/shared/`; remove `@ts-nocheck`; add explicit types
- [x] 4.7 Copy `workers/lemonade/help.ts` and `commands.ts` into `llm-agents/workers/`; remove `@ts-nocheck`; wire to `LlmProvider`
- [x] 4.8 Create `llm-agents/src/index.ts` barrel exporting `runCommit`, `runPrecommit`, `runDocsUpkeep`, `runTestUpkeep`, `runReviewAgent`, `listActions`, `runAction`
- [x] 4.9 Create `llm-agents/workers/llm-agents.ts` entry point for CLI worker (replaces llm-tools `workers/llm-agents.ts`); remove `@ts-nocheck`
- [x] 4.10 Run `tsc --noEmit` on `llm-agents`; fix all type errors

## 5. llm-tools — Slim Down

- [x] 5.1 Add `@cfxdevkit/llm-client` and `@cfxdevkit/llm-agents` as workspace dependencies in `llm-tools/package.json`
- [x] 5.2 Update `workers/lemonade/cli.ts`: replace inline `completion/` and `commit/` imports with imports from `@cfxdevkit/llm-agents`; remove `@ts-nocheck`; add explicit types
- [x] 5.3 Update `workers/llm-agents.ts`: replace inline `agents/` imports with imports from `@cfxdevkit/llm-agents`; remove `@ts-nocheck`
- [x] 5.4 Delete `llm-tools/workers/lemonade/completion/` (including `pi.ts`, `pi-rpc.ts`), `workers/lemonade/shared/`, `workers/lemonade/commit/`, `workers/lemonade/docs/`, `workers/lemonade/tests/`, `workers/lemonade/commands.ts`, `workers/lemonade/help.ts`
- [x] 5.5 Delete `llm-tools/workers/agents/`
- [x] 5.6 Run `tsc --noEmit` on `llm-tools`; fix all remaining type errors
- [x] 5.7 Verify `grep -r "@ts-nocheck" repos/cfx-llm/packages/` returns no results

## 6. Moon & Workspace Wiring

- [x] 6.1 Add `repos/cfx-llm/packages/**` to the `platform` tier `paths` array in `repos/cfx-meta/arch-rules.yaml` (so arch-check validates both new packages as T1)
- [x] 6.2 Confirm `.moon/workspace.yml` lists `repos/cfx-llm/packages/llm-client`, `repos/cfx-llm/packages/llm-agents`, and `repos/cfx-llm/packages/llm-tools`
- [x] 6.3 Run `pnpm install` to wire workspace deps
- [x] 6.4 Run `pnpm exec moon run cfx-llm-llm-client:build cfx-llm-llm-agents:build cfx-llm-llm-tools:build` and confirm all three succeed

## 7. Arch-Check & Validation

- [x] 7.1 Run `pnpm run arch:check` — confirm `llm-client` and `llm-agents` pass tier rules (Tier 1 or Tier 2 per cfx-llm domain)
- [x] 7.2 Run `pnpm run lint` — confirm no biome errors across new packages
- [x] 7.3 Run `pnpm exec moon run :test` — confirm tests pass (or skip gracefully)
- [x] 7.4 Run `pnpm run check:secrets` — confirm no secret leaks
- [x] 7.5 Run `pnpm run check:hotspots` — confirm no hard file-size violations in new packages

Note: global `pnpm exec moon run :test` currently fails in unrelated non-LLM packages (`contracts-extract`, `contracts`, `hardware-bridge`, `protocol`, `showcase`, `testing`) with Moon/Vitest startup panics. Scoped LLM Moon tests (`llm-client:test`, `llm-agents:test`, `llm-tools:test`) pass.

## 8. Documentation

- [x] 8.1 Create `repos/cfx-llm/packages/llm-client/README.md` (package purpose, install, exports)
- [x] 8.2 Create `repos/cfx-llm/packages/llm-agents/README.md` (package purpose, agent list, provider injection pattern)
- [x] 8.3 Update `repos/cfx-llm/packages/llm-tools/README.md` to reflect the slimmed role (CLI dispatcher)
- [x] 8.4 Update `repos/cfx-llm/CHANGELOG.md` with a summary of the split
