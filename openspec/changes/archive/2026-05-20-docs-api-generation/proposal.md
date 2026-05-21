## Why

Twelve packages are missing `API.md` (including the three newly created packages from Phase 1). Existing `API.md` files are hand-written and drift silently as exports change — no check enforces that they reflect current sources. The `llm:docs-upkeep` pipeline updates narrative prose but cannot reliably enumerate or validate the **public API surface** because it doesn't parse TypeScript exports.

Two gaps to close:
1. **Deterministic skeleton** — derive sub-path table, export list, and type signatures directly from `package.json` exports + compiled `.d.ts` output. No LLM, always reproducible.
2. **LLM enrichment** — fill descriptions, usage notes, and cross-references using the local Lemonade model on top of the deterministic skeleton.

Both gaps are now feasible: after Phase 1, all packages build cleanly and produce `.d.ts` under `dist/`.

## What Changes

- `@cfxdevkit/arch-check` gains a new `generate:api` bin that reads a package's `dist/*.d.ts` and `package.json` exports and emits a deterministic `API.md` skeleton (sub-paths table + export signature blocks).
- `check:docs` gains a new check that flags public packages missing `API.md` or where exports have changed since the last generation (via a stable hash in a comment footer).
- A new `llm:docs-api` script in `repos/cfx-tools/infra/llm-tools` runs `generate:api` for all public packages, then calls the local LLM to enrich descriptions.
- The existing `llm:docs-upkeep` flow calls `check:docs` (which now includes API staleness) before generating prose.

## Capabilities

### New Capabilities

- `deterministic-api-extract`: Reads compiled `.d.ts` files for all sub-path entries declared in `package.json` exports and emits a structured `API.md` with: header, sub-paths table, and per-export typed signature blocks. Fully deterministic — same source always produces same output.
- `api-docs-staleness-check`: Extends `check:docs` with a check that: (a) warns for public packages missing `API.md`, (b) warns when the export hash embedded in `API.md` footer is stale relative to the current `dist/*.d.ts` content.
- `llm-api-enrichment`: New `llm:docs-api` CLI command that runs `generate:api` for each public package, then submits the skeleton + source context to the local LLM to fill in one-line descriptions per export symbol and a usage example per sub-path.

### Modified Capabilities

- `docs-upkeep`: Add `generate:api --check` (staleness gate) as step 0 of `llm:docs-upkeep` so the LLM prose pass always has accurate API skeletons to read from.

## Impact

Affects:
- `repos/cfx-tools/packages/arch-check` — new bin + new docs check
- `repos/cfx-tools/infra/llm-agents` — new `docs/api.ts` worker
- `repos/cfx-tools/infra/llm-tools` — new CLI command registration
- Root `package.json` — new `llm:docs-api` script entry
- All 12 packages missing `API.md` — files generated on first run
