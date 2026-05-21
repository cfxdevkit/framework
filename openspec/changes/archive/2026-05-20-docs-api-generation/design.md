## Context

The monorepo publishes 25+ packages. `API.md` files document the public contract for each package. They are currently hand-written and maintained manually. 12 packages are missing `API.md` entirely — three of them were created in Phase 1 (keystore-server, ui, ui-core). Existing files drift silently as TypeScript exports change.

The existing `pnpm llm:docs-upkeep` pipeline handles narrative prose but treats API surface as opaque text to paraphrase, not structured data to validate. There is no check gate that enforces API.md completeness or freshness.

All packages build cleanly after Phase 1 and emit `.d.ts` files under `dist/`. The TypeScript compiler is available in every package's dev dependencies.

## Goals / Non-Goals

**Goals:**
- Deterministic `API.md` skeleton generation from compiled `.d.ts` + `package.json` exports (no LLM).
- Staleness check: hash of public `.d.ts` content embedded in `API.md`, checked by `check:docs`.
- LLM-enrichment layer: `llm:docs-api` fills descriptions on top of skeleton using local Lemonade model.
- Missing-API.md warning added to `check:docs` for all public packages.
- Hook staleness gate into `llm:docs-upkeep` step 0.

**Non-Goals:**
- Replacing hand-authored sections in existing `API.md` (first run preserves manual content if hash is current).
- Cross-package hyperlinks in generated output.
- API compatibility diff / semver bump detection (separate concern).
- TypeScript interface members deep-expansion (only surface-level declarations in skeleton).

## Decisions

### D1: Parse `.d.ts` directly (not TypeScript source)
`.d.ts` files under `dist/` already represent the *compiled* public surface — resolved generics, stripped internals, stable. Parsing them avoids recompiling and keeps the tool fast. The `typescript` package is already a dev dep and can parse `.d.ts` with `ts.createSourceFile()` to enumerate top-level declaration names and their kinds.

### D2: Per-subpath sections, not per-file sections
The `package.json` `exports` map is the authoritative sub-path list. For each declared sub-path (other than `./package.json`), the generator finds the corresponding `dist/*.d.ts` entry point and lists exports in a code block. This mirrors the existing hand-authored style.

### D3: Hash in `API.md` footer for staleness detection
A SHA-256 of all sub-path `.d.ts` file contents (sorted by sub-path key) is appended as:
```
<!-- api-hash: <hex> -->
```
`check:docs` recomputes this hash and emits a `warning` finding when it differs. This is cheap (hash comparison) and deterministic.

### D4: Two-phase run: `generate:api --check` vs `generate:api --write`
- `--check` (default, used by `check:docs`): re-compute hashes, emit findings, do not write files.
- `--write`: write/overwrite `API.md` for each package that is missing or stale.
- `--package <name>`: scope to one package.

### D5: LLM enrichment lives in `llm-agents/workers/docs/api.ts` (not arch-check)
Deterministic skeleton generation is in arch-check (pure TypeScript, no LLM). LLM enrichment is a separate worker called by a new `llm:docs-api` command wired through llm-tools, following the same pattern as `llm:docs-upkeep`.

### D6: Filter public packages for API.md generation
Only packages where:
- `package.json` has `"private": false` (or no `private` field) in a `repos/*/packages/` path, OR
- The package is in `Tier 0` (framework) or `Tier 1` (platform) per `arch-rules.yaml`.
Config packages (biome-config, tsconfig, moon-config) and internal-only infra packages are skipped.

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| `.d.ts` re-exports (`export * from`) make it hard to enumerate concrete symbols | Resolve one level of `export * from` via recursive `dist/` traversal; cap at depth 2 |
| LLM descriptions may be inaccurate / hallucinated | LLM output is written into the enrichment section only; deterministic skeleton section has a `[deterministic]` marker so future runs can update it independently |
| Large packages (e.g. `@cfxdevkit/core`) have many symbols | Generate summary-mode by default (group by kind, count symbols); `--verbose` mode lists all |
| Existing hand-authored `API.md` with rich content will be overwritten | `--write` only overwrites if hash is stale; preserves file if hash matches current sources |
