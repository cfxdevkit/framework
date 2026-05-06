# @cfxdevkit/llm-tools

Local LLM automation tools for the Conflux DevKit monorepo.

This package owns the Lemonade/Pi developer harness and deterministic repo upkeep agents. It lives in `repos/cfx-llm` because local LLM and AI-assisted maintenance are isolated from the general developer tooling slice.

## Commands

| Command | Purpose |
|---------|---------|
| `llm:commit` | Hardened local LLM commit pipeline with code-hotspot checks, prechecks, Changeset guidance, approval, explicit staging, and commit execution |
| `llm:docs-upkeep` | Delegate documentation maintenance recommendations to the local LLM after deterministic docs checks have produced context |
| `llm:test-audit` | Ask the local LLM whether changed code has meaningful test and precheck coverage |
| `llm:health` | Ask the local LLM to summarize repo health, drift, and automation gaps |
| `llm:validation` | Ask the local LLM to choose the minimum useful validation commands for the current change |
| `llm:changeset`, `llm:release`, `llm:ci-cd`, `llm:docs-pipeline` | Repo-aware Lemonade actions for Changesets, npm publishing, GitHub Actions, docs image publishing, and VPS deploy readiness |
| `llm:all`, `llm:ci`, `llm:corpus`, `llm:docs`, `llm:eval`, `llm:review`, `llm:hotspots`, `llm:serve-check` | Deterministic repo upkeep agents that produce artifacts under `artifacts/llm/` |

Root `pnpm run llm:*` scripts route through this package so developers can keep using the short commands from the workspace root.

`llm:commit` runs `llm hotspots --fail-on-hard` as a non-bypassable quality gate. The scanner applies the framework design-principles file budget across source files in the whole repository, writes `artifacts/llm/reports/code-hotspots.md`, and blocks commits while any source file exceeds the hard 300-line limit.

`llm:commit` no longer edits package changelogs directly. Changesets own version bumps and release changelogs. When publishable package changes are detected and no `.changeset/*.md` file is present, the commit pipeline can generate a draft Changeset and stage it with the commit. Use `--changeset-bump patch|minor|major` to force the bump level, or `--skip-changeset` / `--no-changeset` when the package change is intentionally unreleased.

## Release and CI/CD

`pnpm run llm:ci` performs deterministic checks for the docs image workflow, VPS deploy workflow, Changesets release workflow, npm publish helper, docs Dockerfile, wiki sync script, and Ansible deployment files. It writes `artifacts/llm/reports/ci-cd.md`.

The delegated Lemonade actions use that deterministic report plus workflow and infrastructure context:

```bash
pnpm run llm:changeset
pnpm run llm:release
pnpm run llm:ci-cd
pnpm run llm:docs-pipeline
```

Use these after touching `.changeset/`, package manifests, `.github/workflows/`, `repos/cfx-tools/packages/docs-site/`, or `infrastructure/ansible/`.

## Docs Upkeep

`pnpm run llm:docs-upkeep` runs a four-phase documentation maintenance loop:

1. Refresh deterministic docs alignment artifacts with `llm:docs`.
2. Discover markdown folder scopes across the repo.
3. Process each folder serially with bounded context from that folder plus repository docs signals.
4. Write per-folder artifacts under `artifacts/llm/reports/docs-upkeep/` and an index at `artifacts/llm/reports/docs-upkeep.md`.

Useful flags:

```bash
pnpm run llm:docs-upkeep -- --quick
pnpm run llm:docs-upkeep -- --docs-only --quick
pnpm run llm:docs-upkeep -- --scope docs/architecture --max-folders 1
pnpm run llm:docs-upkeep -- --quick --write --yes --max-folders 3
```

By default the command produces reviewable artifacts only. Add `--write` to let the local model return exact search/replace edits for existing markdown files in the current folder scope. Write mode never creates new files, skips updates outside the folder scope, and only applies replacements whose old text matches exactly once.

## Backend

The delegated commands use Lemonade Server directly by default. Commit preparation can also use Pi via `--agent pi-rpc`, which registers a generated local Lemonade provider extension under `artifacts/llm/config/`.
