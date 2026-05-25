# Documentation Refresh — Canonical Sequence

> Last updated: 2026-05-25

## Current state (before refresh)

| Layer | What | Status |
|-------|------|--------|
| **L1** `API.md` | Public API signatures extracted from `dist/*.d.ts` | 7 packages **stale** |
| **L2** `STRUCTURE.md` | File-tree skeleton with inline descriptions | 24 packages **incomplete** |
| **L3** `README.md` | Install + usage prose per package | Most packages **ok** (hash-stamped) |
| **L4** Package MDX | docs-site `content/packages/<slug>.mdx` stubs | 27 pages (need re-enrich) |
| **L5** Wiki | docs-site `content/wiki/*.mdx` from gitnexus | Generated with **Qwen3-Coder-30B** (stale, needs 122B) |

---

## Canonical refresh sequence

### STEP 1 — Re-analyze gitnexus index (if source changed)
```bash
pnpm exec gitnexus analyze
```
Only needed if commits touched source code. Skip if only docs/config changed.

### STEP 2 — Deterministic generation (no LLM, idempotent)
```bash
cdk docs generate all
```
Runs in sequence:
- `gen:api` → regenerates stale/missing `API.md` from `dist/*.d.ts` hashes
- `gen:readme` → scaffolds missing `README.md` sections (never overwrites enriched prose)  
- `gen:structure` → regenerates stale/missing `STRUCTURE.md` file-tree skeletons
- `gen:unit-configs` → syncs moon unit config files
- `sync:packages` → writes/updates `docs-site/content/packages/<slug>.mdx` stubs

### STEP 3 — LLM enrichment (single pass per document type)
```bash
cdk docs enrich all
```
Runs in order. Each sub-command is **skip-on-hash** — if the skeleton hash matches the last enrichment run, no LLM call is made:
- `enrich api` → fills API.md symbol descriptions + usage examples
- `enrich readme` → fills README.md placeholders + code examples
- `enrich structure` → fills STRUCTURE.md file descriptions
- `enrich packages` → fills docs-site MDX description slots + examples

### STEP 4 — Wiki regeneration (LLM, full rewrite)
```bash
cdk docs wiki generate
```
- Reads curated `module_tree.json` from `.gitnexus/wiki/`
- Calls `gitnexus wiki --force` with Qwen3.5-122B + `--reasoning-model`
- Post-processes each page: `simplifyMermaidDiagram` → `fixMermaidLabels` → escape
- Removes stale `.mdx` pages with no matching source
- Syncs all new pages to `docs-site/content/wiki/`

### STEP 5 — Validate
```bash
cdk docs validate content   # MDX compilation check (all packages pages)
cdk docs validate wiki      # Mermaid fence validation in wiki pages
```

### STEP 6 — Commit
```bash
cdk repo commit
```

---

## Quick-reference

| I want to… | Command |
|-----------|---------|
| Regenerate everything from scratch | Steps 1–5 above |
| Refresh only stale API.md files | `cdk docs generate api` |
| Refresh only structure docs | `cdk docs generate structure` |
| Enrich only README files | `cdk docs enrich readme` |
| Regenerate wiki only | `cdk docs wiki generate` |
| Sync wiki MDX without regenerating | `cdk docs wiki sync` |
| Validate wiki mermaid | `cdk docs wiki validate` |
| Check what's stale | `pnpm run check:docs` |

---

## Notes on overlapping layers

The layers build on each other but are independent:

```
dist/*.d.ts  ──► API.md (deterministic, hash-gated)
                   └──► enrich api (LLM, skip-on-hash)

src/ tree    ──► STRUCTURE.md (deterministic, hash-gated)
                   └──► enrich structure (LLM, skip-on-hash)

package.json ──► README.md scaffold (deterministic, skip if exists)
                   └──► enrich readme (LLM, skip-on-hash)

package.json
+ README.md  ──► docs-site MDX stub (deterministic, hash-gated)
+ API.md         └──► enrich packages (LLM, skip-on-hash)

source code  ──► gitnexus analyze ──► wiki generate (LLM, always --force)
                                        └──► wiki sync (deterministic)
```

**Important:** `generate all` and `enrich all` are safe to re-run at any time. They skip unchanged files. `wiki generate` always does a full LLM generation pass (use only when wiki content is genuinely stale).
