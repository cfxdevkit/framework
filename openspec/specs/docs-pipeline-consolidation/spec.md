# docs-pipeline-consolidation Specification

## Purpose
Consolidate the documentation generation system to exactly two phases: deterministic skeleton generation and a single bounded LLM enrichment pass. Remove the unpredictable folder-walking upkeep flow. Unify wiki LLM generation through the standard provider routing.

---

## Requirement: docs-upkeep flow SHALL be removed

All files, exports, and command surface entries for the `docs-upkeep` / `runDocsUpkeep` folder-walking flow SHALL be deleted.

### Files to delete
- `llm-agents/workers/docs/generate.ts`
- `llm-agents/workers/docs/discover.ts`
- `llm-agents/workers/docs/write.ts`
- `llm-agents/workers/docs/validate.ts`
- `docs-pipeline/src/wiki-update.ts`

### Exports to remove
- `runDocsUpkeep` from `llm-agents/src/index.ts`
- `repoActions['docs-upkeep']` from `workers/shared/repo-actions.ts`
- `'docs-upkeep'` from `agents/smoke.ts` action list
- `update-wiki` command from `docs-pipeline/src/commands.ts` and `scripts.ts`
- `updateWiki`, `regenerateWiki` from `docs-pipeline/src/index.ts`
- `enrich content` target from `tooling-cli/src/docs-namespace.ts`

#### Scenario: enrich content is rejected
- **WHEN** `cdk docs enrich content` is run
- **THEN** the CLI SHALL print an error: `'content' is not a valid enrich target. Use: api, readme, structure, packages, all`
- **AND** exit with code 1

#### Scenario: docs-upkeep action is absent from smoke test list
- **WHEN** `cdk agent smoke` runs
- **THEN** `docs-upkeep` SHALL NOT appear in the probe list

---

## Requirement: wiki generation SHALL route through llm-agents provider routing

`wiki-update.ts` with hardcoded config paths SHALL be replaced by `runWikiGenerate()` in `llm-agents/workers/docs/wiki.ts`.

`runWikiGenerate()` SHALL:
1. Resolve provider config via `resolveAgentConfigPath` / standard llm-agents config loader
2. Extract `baseUrl` and `model` from the resolved config (using the `docs-api` action policy as the provider tier selection — wiki generation is a comparable operation)
3. Spawn `gitnexus wiki --base-url <url> --model <model> --api-key local --force --concurrency 1`
4. After successful generation, call `syncWiki()` to convert `.gitnexus/wiki/*.md` → `content/wiki/*.mdx`

#### Scenario: wiki generate uses configured provider
- **WHEN** `cdk docs wiki generate` is run
- **THEN** the process SHALL NOT read `artifacts/llm/config/llm.json` or `artifacts/llm/config/lemonade.json`
- **AND** SHALL resolve the LLM endpoint from the standard config path used by all other llm-agents commands

---

## Requirement: docs-pipeline/src/llm/ SHALL be renamed pipeline/

All files under `docs-pipeline/src/llm/` SHALL be moved to `docs-pipeline/src/pipeline/`. Internal imports SHALL be updated. External consumers import from `@cfxdevkit/docs-pipeline` via `src/index.ts` — no change required in consumers.

---

## Requirement: discoverPublicPackages SHALL have one implementation

The private `discoverPublicPackages()` in `llm-agents/workers/docs/readme.ts` SHALL be replaced with `discoverDocsPackages()` imported from `@cfxdevkit/docs-pipeline`. The `PkgEntry` type (`rel`, `name`, `skeletonHash`) SHALL be satisfied by `DocsPackageRecord` (which already carries these fields or equivalent).

#### Scenario: readme enrichment uses pipeline discovery
- **WHEN** `cdk docs enrich readme` runs
- **THEN** the package list SHALL be sourced from `discoverDocsPackages()` in docs-pipeline
- **AND** the filtering (exclude config packages, exclude private) SHALL use docs-pipeline's single filter

---

## Requirement: flag parsing SHALL be shared

A new `parseDocFlags(args, fields)` function in `llm-agents/workers/docs/flags.ts` SHALL replace the 4 duplicate manual parsers.

Signature:
```ts
type DocFlagField = 'quick' | 'model' | 'force' | 'package' | 'no-thinking' | 'yes';
type DocFlags = {
  quick: boolean;
  model?: string;
  force: boolean;
  package?: string;
  noThinking: boolean;
  yes: boolean;
};
function parseDocFlags(args: string[], fields?: DocFlagField[]): DocFlags
```

All 4 doc workers SHALL use `parseDocFlags` instead of their private parsers.

---

## Requirement: package-page MDX enrichment SHALL be re-enabled

`runDocsPackagePages` step 3 SHALL no longer be disabled. The enrichment SHALL use targeted section injection (write only to placeholder slots) rather than full-file rewrite. The enrichment SHALL check and respect the skeleton hash — skip if hash matches previous enrichment.

#### Scenario: package-page enrichment is idempotent
- **WHEN** `cdk docs enrich packages` runs twice on unchanged sources
- **THEN** the second run SHALL skip all packages (all hashes match)
- **AND** SHALL NOT make any LLM calls

---

## Requirement: cdk docs command surface SHALL match design D7

```
cdk docs generate <api|readme|structure|packages> [--check] [--package <name>]
cdk docs enrich  <all|api|readme|structure|packages> [args...]
cdk docs wiki    <generate|sync|validate> [args...]
cdk docs validate <content|wiki|wiki-fix>
cdk docs sync    <all|architecture|coverage>
```

Help text SHALL reflect this surface. No `update-wiki`, no `enrich content`.

---

## Invariants (non-negotiable)

1. `generate` pass is always hash-idempotent — same source → same output → same hash
2. `enrich` is always skip-on-match — if skeleton hash unchanged and enrichment ran → no LLM call
3. No enrichment pass modifies source files (`.ts`, `.json`, etc.) — only doc files (`.md`, `.mdx`)
4. All LLM calls use `completeStructuredAgent` with an `action` key — no raw provider calls
5. `generate` must succeed before `enrich` is useful — CLI warns if skeleton is missing
