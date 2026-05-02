# @cfxdevkit/llm-tools

Local LLM automation tools for the Conflux DevKit monorepo.

This package owns the Lemonade/Pi developer harness and deterministic repo upkeep agents. It lives in `repos/cfx-tools` because it is Tier 1 developer infrastructure: useful for humans and automation, but never a runtime dependency of deployed projects.

## Commands

| Command | Purpose |
|---------|---------|
| `llm:commit` | Hardened local LLM commit pipeline with prechecks, changelog generation, approval, explicit staging, and commit execution |
| `llm:docs-upkeep` | Delegate documentation maintenance recommendations to the local LLM after deterministic docs checks have produced context |
| `llm:test-audit` | Ask the local LLM whether changed code has meaningful test and precheck coverage |
| `llm:health` | Ask the local LLM to summarize repo health, drift, and automation gaps |
| `llm:validation` | Ask the local LLM to choose the minimum useful validation commands for the current change |
| `llm:all`, `llm:corpus`, `llm:docs`, `llm:eval`, `llm:review`, `llm:serve-check` | Deterministic repo upkeep agents that produce artifacts under `artifacts/llm/` |

Root `pnpm run llm:*` scripts route through this package so developers can keep using the short commands from the workspace root.

## Docs Upkeep

`pnpm run llm:docs-upkeep` runs a four-phase documentation maintenance loop:

1. Refresh deterministic docs alignment artifacts with `llm:docs`.
2. Discover documentation folder scopes under `docs/`.
3. Process each folder serially with bounded context from that folder plus repository docs signals.
4. Write per-folder artifacts under `artifacts/llm/reports/docs-upkeep/` and an index at `artifacts/llm/reports/docs-upkeep.md`.

Useful flags:

```bash
pnpm run llm:docs-upkeep -- --quick
pnpm run llm:docs-upkeep -- --scope docs/architecture --max-folders 1
pnpm run llm:docs-upkeep -- --include-package-docs --max-folders 10
```

The command produces reviewable artifacts; it does not silently rewrite checked-in docs.

## Backend

The delegated commands use Lemonade Server directly by default. Commit preparation can also use Pi via `--agent pi-rpc`, which registers a generated local Lemonade provider extension under `artifacts/llm/config/`.
