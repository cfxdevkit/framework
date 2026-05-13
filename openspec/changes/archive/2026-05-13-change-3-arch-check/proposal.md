## Why

`repos/cfx-llm/packages/llm-tools` has grown to own two distinct concerns: deterministic repo-health checks (hotspots, secret-leak scan, CI/docs/corpus/eval validation) and LLM-agent orchestration. The deterministic checks do not need an LLM; they belong in the developer-platform tier alongside other tooling packages. Moving them creates a clean, fast-failing `arch:check` surface that CI and local workflows can call without touching the LLM stack, and allows `llm-tools` to focus exclusively on LLM-agent logic (Change 5).

## What Changes

- **New package `repos/cfx-tools/packages/arch-check/`** (`@cfxdevkit/arch-check`) — a TypeScript-first platform package that consolidates all deterministic repo-health checks:
  - `check:secrets` — absorbs `scripts/check-secret-leaks.mjs` (rewritten to TypeScript)
  - `check:hotspots` — absorbs `workers/code-hotspots.ts` from `llm-tools` (rewritten to TypeScript, removes `@ts-nocheck`)
  - `check:ci` — absorbs the `cicd` agent check from `llm-tools/workers/agents/cicd.ts`
  - `check:docs` — absorbs the `docs` agent check from `llm-tools/workers/agents/docs.ts`
  - `check:corpus` — absorbs the `corpus` agent from `llm-tools/workers/agents/corpus.ts`
  - `check:eval` — absorbs the `eval` agent check from `llm-tools/workers/agents/eval-serve.ts`
  - `arch:check` — **new** deterministic tier-boundary + package-layout validator powered by `@cfxdevkit/arch-rules`
- **Root `package.json` script aliases updated**: `quality:hotspots → check:hotspots`, `security:secrets → check:secrets`; LLM-specific agent scripts remain under `llm:*` prefix but now delegate to the surviving parts of `llm-tools`
- **`scripts/check-secret-leaks.mjs` deleted** after its logic is absorbed into `arch-check`
- **`workers/code-hotspots.ts` removed from `llm-tools`** after migration
- **`llm-tools` `llm:*` dispatch table pruned** of the absorbed non-LLM checks; `llm:ci`, `llm:docs`, `llm:corpus`, `llm:eval`, `llm:hotspots` in root `package.json` now delegate to `arch-check` moon tasks instead

## Capabilities

### New Capabilities

- `arch-check`: Deterministic monorepo health-check package in cfx-tools. Provides typed check runners for secrets, hotspots, CI wiring, docs, corpus metadata, eval gates, and tier-boundary validation. Exposes all checks as moon tasks callable without an LLM.

### Modified Capabilities

- `arch-rules`: `arch-check` depends on `@cfxdevkit/arch-rules`; the `arch:check` task is the first consumer of `getTierFor` / `getRulesFor`. No spec-level requirements change — only the consumption surface is added.

## Impact

- **New package**: `repos/cfx-tools/packages/arch-check/` added to `pnpm-workspace.yaml` and `.moon/workspace.yml`
- **`repos/cfx-llm/packages/llm-tools`**: `workers/code-hotspots.ts` deleted; agent wrappers for non-LLM checks (`cicd`, `docs`, `corpus`, `eval-serve`) either deleted or thinned to delegate to `arch-check`
- **`scripts/check-secret-leaks.mjs`** deleted
- **Root `package.json`**: `quality:hotspots`, `security:secrets`, `security:check` scripts updated to call arch-check moon tasks
- **`@cfxdevkit/arch-rules`** added as a `devDependency` of `arch-check`
- No published packages are affected (`llm-tools` is `private: false` but has no dependents in the monorepo importing the removed workers)
