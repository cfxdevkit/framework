## Decisions

### D1 — docs-upkeep is removed, not refactored

`runDocsUpkeep` and its supporting files (`generate.ts`, `discover.ts`, `write.ts`, `validate.ts`) are deleted entirely. The folder-walking, multi-pass, replacement-hunk approach is fundamentally unpredictable. The correct substitute is: run `generate` (deterministic) once, then `enrich` (single LLM pass) per document type. Any "drift" assessment a human might want is answered by running `cdk repo check docs` + inspecting the git diff after enrichment.

### D2 — wiki LLM generation routes through llm-agents, not gitnexus CLI directly

`wiki-update.ts` called `gitnexus wiki` by spawning a subprocess and passing hardcoded Lemonade URLs from deleted config files. The new `runWikiGenerate()` reads the provider configuration through the standard llm-agents config path (`resolveAgentConfigPath`) and passes the resolved `baseUrl` and `model` to `gitnexus wiki`. This keeps the wiki generation consistent with the 3-tier model routing in `.pi/providers.json`.

The `gitnexus wiki` CLI accepts `--base-url` and `--model`. We pass these from the resolved config. The generation still happens inside gitnexus (it walks the codebase and writes `.gitnexus/wiki/*.md`). After generation, `wiki:sync` converts the output to MDX.

### D3 — `docs-pipeline/src/llm/` renamed to `docs-pipeline/src/pipeline/`

The `llm/` sub-directory contains no LLM calls. It holds utilities consumed by `llm-agents/workers/docs/`. Renaming it `pipeline/` clarifies that this is "docs pipeline internals for external consumers" not "the LLM layer". All import paths in `llm-agents` workers update accordingly (`from '@cfxdevkit/docs-pipeline'` — no change in consumer code, since these are re-exported from `src/index.ts`).

### D4 — `discoverPublicPackages` canonicalized in docs-pipeline

`docs-pipeline/src/discover-packages.ts` already has `discoverDocsPackages()` which is used by the deterministic generators. `llm-agents/workers/docs/readme.ts` has a private `discoverPublicPackages()` doing the same walk with a different schema. The llm-agents version is replaced with an import of `discoverDocsPackages` from `@cfxdevkit/docs-pipeline`, using the shared `DocsPackageRecord` type. The `skeletonHash` field needed by `enrichReadmeMd` is already computed in `DocsPackageRecord`.

### D5 — shared flag parser

All four workers (`api.ts`, `readme.ts`, `structure.ts`, `packages.ts`) parse the same 6 flags manually. A new `parseDocFlags(args: string[], fields: DocFlagField[])` in `llm-agents/workers/docs/flags.ts` handles this declaratively. Each worker calls `parseDocFlags(args, ['quick', 'model', 'force', 'package', 'no-thinking', 'yes'])` and gets a typed result. The `docs-upkeep`-specific flags (`--scope`, `--max-folders`, `--docs-only`, `--write`, `--agent`) are not carried forward since `docs-upkeep` is removed.

### D6 — package-page MDX enrichment re-enabled

`packages.ts` had step 3 (`LLM enrich docs-site package pages`) disabled with a comment "temporarily disabled to avoid destructive MDX rewrites." The destructive rewrite happened because enrichment rewrote the entire MDX file. The correct approach is the same as API/README enrichment: targeted section injection, not file rewrite. The enrichment writes only to the description slots in the MDX skeleton, preserving frontmatter, install tabs, and sub-paths table exactly. The enrichment checks the skeleton hash before writing and skips if the hash matches a previous enrichment run.

### D7 — `cdk docs` command surface after this change

```
cdk docs generate <api|readme|structure|packages> [--check] [--package <name>]
cdk docs enrich  <api|readme|structure|packages|all> [--quick] [--force] [--package <name>]
cdk docs wiki    <generate|sync|validate> [wiki generate args...]
cdk docs validate <content|wiki|wiki-fix>
cdk docs sync    <all|architecture|coverage>         (existing — unchanged)
```

`sync` still exists for architecture and coverage pages (non-package docs that have no enrichment phase). The `validate` commands are unchanged. The wiki sub-commands replace the old `wiki [extra args]` top-level command.

## Invariants

1. **Deterministic before LLM**: `generate` always runs before `enrich`. If a skeleton doesn't exist, enrichment skips.
2. **Hash idempotency**: Re-running `generate` on unchanged sources produces identical output. Re-running `enrich` on an already-enriched file (matching hash) is a no-op.
3. **One-way flow**: Phase 2 (enrichment) reads Phase 1 output but never writes back to Phase 1 inputs (no source file modification).
4. **Bounded scope**: Each LLM call is scoped to a single package's document. No folder-level multi-file calls.
5. **Provider routing**: All LLM calls go through `completeStructuredAgent` with the `action` parameter selecting the tier-appropriate model from `.pi/providers.json`.
