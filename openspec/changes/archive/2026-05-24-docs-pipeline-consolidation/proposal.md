## Why

The documentation system grew in two generations that now overlap and conflict. Generation 1 ("upkeep") walks every documentation folder and asks the LLM to assess drift and produce replacement hunks — a fragile, non-deterministic, multi-pass process where the same file can be touched by both the folder-walking pass and the per-document enrichment pass. Generation 2 ("enrichment") is the correct model: deterministic skeleton generation first, then a single LLM pass per document bounded to a known structure.

The `wiki-update.ts` path still reads deleted config files (`artifacts/llm/config/llm.json`) and spawns `gitnexus wiki` without using the llm-agents provider routing. The `docs-pipeline/src/llm/` sub-directory contains zero LLM calls — it was named for its consumers, creating false architectural boundaries. `discoverPublicPackages` is implemented independently in both `docs-pipeline` and `llm-agents/workers/docs/readme.ts`. Flag parsing is duplicated 4 times.

## What Changes

### Remove (generation 1 flows)
- `llm-agents/workers/docs/generate.ts` — folder-level upkeep artifact generator
- `llm-agents/workers/docs/discover.ts` — folder-walking scope discovery
- `llm-agents/workers/docs/write.ts` — folder artifact writer
- `llm-agents/workers/docs/validate.ts` — upkeep JSON schema validator
- `llm-agents/workers/docs/index.ts:runDocsUpkeep` — the orchestrator
- `docs-pipeline/src/wiki-update.ts` — old gitnexus wiki spawner with hardcoded config
- `docs-pipeline/src/commands.ts:update-wiki` command entry
- `docs-pipeline/src/scripts.ts:update-wiki` command entry
- `repoActions['docs-upkeep']` from `repo-actions.ts`
- `enrich content` from `docs-namespace.ts`
- `docs-upkeep` from `agents/smoke.ts` action list
- `docs-pipeline/src/llm/` sub-directory — merge into `docs-pipeline/src/pipeline/`

### Add (wiki LLM via proper routing)
- `cdk docs wiki:generate` → `runWikiGenerate()` in llm-agents, using `completeStructuredAgent` / provider routing, passing Lemonade base URL and model from `.pi/providers.json` via the standard action config. Calls `gitnexus wiki` using the resolved provider config, not hardcoded URLs.
- `cdk docs wiki:sync` (already exists as `cdk docs sync wiki` — rename for clarity)
- `cdk docs wiki:validate` (already exists — expose explicitly)

### Unify
- Single `discoverPublicPackages()` — lives in `docs-pipeline/src/discover-packages.ts`; `readme.ts` in llm-agents imports from `@cfxdevkit/docs-pipeline`
- Single `parseDocFlags(args, fields)` utility in `llm-agents/workers/docs/flags.ts`

### Clean
- `docs-pipeline/src/llm/` renamed to `docs-pipeline/src/pipeline/` — directory name reflects "pipeline utilities for consumers" not "LLM code"
- `docs-pipeline/src/index.ts` exports cleaned: remove `updateWiki`, `regenerateWiki`

## Capabilities After

**Deterministic** (`cdk docs generate`):
- `generate api` — arch-check: API.md skeleton from dist types
- `generate readme` — arch-check: README.md scaffold + section backfill
- `generate structure` — arch-check: STRUCTURE.md file tree
- `generate packages` (new name for `sync packages`) — docs-pipeline: MDX stubs

**Enrichment, single pass** (`cdk docs enrich`):
- `enrich api` — fills API.md symbol descriptions + examples
- `enrich readme` — fills README.md placeholders + code examples
- `enrich structure` — fills STRUCTURE.md file descriptions
- `enrich packages` — fills MDX page descriptions + examples (re-enabled with safe write)

**Wiki** (`cdk docs wiki`):
- `wiki generate` — runs gitnexus wiki via llm-agents provider routing
- `wiki sync` — deterministic MDX conversion from .gitnexus/wiki/
- `wiki validate` — mermaid fence validator

**Removed**:
- `enrich content` / `docs-upkeep` — folder-walking, non-deterministic, multi-pass

## Impact

- `llm-agents/workers/docs/index.ts` — remove `runDocsUpkeep`; keep other exports
- `llm-agents/workers/docs/generate.ts`, `discover.ts`, `write.ts`, `validate.ts` — deleted
- `llm-agents/workers/docs/readme.ts` — `discoverPublicPackages` replaced with import from `@cfxdevkit/docs-pipeline`
- `llm-agents/workers/shared/repo-actions.ts` — remove `docs-upkeep` action
- `llm-agents/workers/agents/smoke.ts` — remove `docs-upkeep` from action list
- `docs-pipeline/src/wiki-update.ts` — deleted
- `docs-pipeline/src/llm/` → renamed `docs-pipeline/src/pipeline/`
- `docs-pipeline/src/commands.ts`, `scripts.ts` — remove `update-wiki`
- `docs-pipeline/src/index.ts` — remove `updateWiki`, `regenerateWiki` exports
- `tooling-cli/src/docs-namespace.ts` — remove `enrich content` target; add wiki sub-commands
- New `llm-agents/workers/docs/wiki.ts` — `runWikiGenerate` using provider routing
- New `llm-agents/workers/docs/flags.ts` — shared `parseDocFlags` utility
