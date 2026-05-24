# Tasks — docs-pipeline-consolidation

## P1 — Remove docs-upkeep flow

- [x] **P1.1** Delete `llm-agents/workers/docs/generate.ts`
- [x] **P1.2** Delete `llm-agents/workers/docs/discover.ts`
- [x] **P1.3** Delete `llm-agents/workers/docs/write.ts`
- [x] **P1.4** Delete `llm-agents/workers/docs/validate.ts`
- [x] **P1.5** Remove `runDocsUpkeep` from `llm-agents/workers/docs/index.ts` (keep other exports)
- [x] **P1.6** Remove `repoActions['docs-upkeep']` entry from `workers/shared/repo-actions.ts`
- [x] **P1.7** Remove `'docs-upkeep'` from `agents/smoke.ts` deterministic action list
- [x] **P1.8** Remove `runDocsUpkeep` export from `llm-agents/src/index.ts`
- [x] **P1.9** Remove `update-wiki` entry from `docs-pipeline/src/commands.ts`
- [x] **P1.10** Remove `update-wiki` branch from `docs-pipeline/src/scripts.ts`
- [x] **P1.11** Remove `updateWiki` and `regenerateWiki` exports from `docs-pipeline/src/index.ts`
- [x] **P1.12** Delete `docs-pipeline/src/wiki-update.ts`
- [x] **P1.13** Remove `enrich content` target and `docsEnrichmentAllSequence` entry for `docs-upkeep` from `docs-namespace.ts`; update help text

## P2 — Rename docs-pipeline/src/llm/ → pipeline/

- [x] **P2.1** Rename directory `docs-pipeline/src/llm/` → `docs-pipeline/src/pipeline/`
- [x] **P2.2** Update all internal imports within docs-pipeline that reference `./llm/` → `./pipeline/`
- [x] **P2.3** Verify `docs-pipeline` builds and typechecks cleanly

## P3 — Unify discoverPublicPackages

- [x] **P3.1** Audit what fields `readme.ts` uses from its private `PkgEntry` (`rel`, `name`, `skeletonHash`) vs `DocsPackageRecord` from docs-pipeline
- [x] **P3.2** If field mismatch: add missing fields to `DocsPackageRecord` in `docs-pipeline/src/discover-packages.ts`
- [x] **P3.3** Replace `discoverPublicPackages` in `llm-agents/workers/docs/readme.ts` with import of `discoverDocsPackages` from `@cfxdevkit/docs-pipeline`
- [x] **P3.4** Update `enrichReadmeMd` calls that use `PkgEntry` type to use `DocsPackageRecord`
- [x] **P3.5** Delete the private `discoverPublicPackages` function and `PkgEntry` type from `readme.ts`

## P4 — Shared flag parser

- [x] **P4.1** Create `llm-agents/workers/docs/flags.ts` with `DocFlagField`, `DocFlags`, `parseDocFlags`
- [x] **P4.2** Replace `parseDocsApiFlags` in `api-flags.ts` with `parseDocFlags` — delete `api-flags.ts`
- [x] **P4.3** Replace `parseDocsReadmeFlags` in `readme.ts` with `parseDocFlags`
- [x] **P4.4** Replace `parseFlags` in `structure.ts` with `parseDocFlags`
- [x] **P4.5** Replace `parseFlags` in `packages.ts` with `parseDocFlags`
- [x] **P4.6** Verify all 4 workers still compile and behave correctly

## P5 — Wiki LLM via provider routing

- [x] **P5.1** Create `llm-agents/workers/docs/wiki.ts` with `runWikiGenerate(args)`
- [x] **P5.2** `runWikiGenerate` resolves provider config via standard llm-agents config loader
- [x] **P5.3** Passes resolved `baseUrl` + `model` to `gitnexus wiki` subprocess
- [x] **P5.4** After successful wiki generation, calls `syncWiki()` from `@cfxdevkit/docs-pipeline`
- [x] **P5.5** Export `runWikiGenerate` from `llm-agents/workers/docs/index.ts`
- [x] **P5.6** Export `runWikiGenerate` from `llm-agents/src/index.ts`
- [x] **P5.7** Add `wiki generate|sync|validate` sub-commands to `docs-namespace.ts`
- [x] **P5.8** Add `runWikiGenerate` call path in `tooling-cli/src/docs-namespace.ts`

## P6 — Re-enable package-page MDX enrichment

- [x] **P6.1** Audit current `package-page-enrichment.ts` — understand why it was disabled
- [x] **P6.2** Rewrite enrichment to use targeted section injection (not full-file rewrite)
- [x] **P6.3** Add hash-check guard: skip enrichment if skeleton hash matches previous enrichment run
- [x] **P6.4** Re-enable step 3 in `packages.ts`
- [x] **P6.5** Test with a single package (`--package @cfxdevkit/cdk`) before enabling for all

## Validate

- [x] **V.1** `cdk docs enrich content` prints error and exits 1
- [x] **V.2** `cdk docs wiki generate` does NOT read `artifacts/llm/config/*.json`
- [x] **V.3** `cdk docs enrich all` runs: api + readme + structure + packages (no docs-upkeep)
- [x] **V.4** `cdk docs enrich readme --package @cfxdevkit/cdk` completes without error
- [x] **V.5** Running `enrich readme` twice on unchanged sources: second run is 100% skips
- [x] **V.6** `pnpm run lint` passes for docs-pipeline and llm-agents
- [x] **V.7** `pnpm run typecheck` passes for all affected packages
- [x] **V.8** `cdk repo precommit` passes with `status: passed`
