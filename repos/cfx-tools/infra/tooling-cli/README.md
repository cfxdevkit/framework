# @cfxdevkit/tooling-cli

Internal root CLI dispatcher for monorepo maintenance tooling.

## Purpose

This package owns the stable root maintenance entrypoint:

```bash
pnpm tooling -- <namespace> <command> [args]
```

It composes package-owned command registries into one grouped help surface and one machine-readable catalog for future TUI consumers.

## Current Namespaces

- `llm` — local LLM automation workflows from `@cfxdevkit/llm-tools`
- `docs` — docs pipeline workflows from `@cfxdevkit/docs-pipeline`

## Catalog

Use this command to inspect the registered maintenance surface without scraping terminal help output:

```bash
pnpm tooling -- catalog
```

## Migration Policy

Root `llm:*`, `docs:*`, and selected `sync:*` scripts remain as compatibility shims during migration, but they delegate through `pnpm tooling` rather than binding directly to package internals.