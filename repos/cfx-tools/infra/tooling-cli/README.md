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
- `agent` — PI-backed interactive, print, and RPC runtime through `@cfxdevkit/cdk-ai`

## Agent Runtime

`cdk agent` is the canonical interactive entrypoint for repository-aware agent work.
The root CLI keeps the stable command surface and delegates the runtime itself to
`@cfxdevkit/cdk-ai`, which currently fronts the PI runtime from `@cfxdevkit/pi-agent`
and launches `pi` from the repository root so project-local
`.pi/` prompts, skills, and extensions stay active.

Common entrypoints:

```bash
pnpm tooling -- agent interactive
pnpm tooling -- agent commit
pnpm tooling -- agent print -- explain the staged changes
pnpm tooling -- agent rpc
pnpm tooling -- agent --scope docs print -- summarize architecture drift
```

Scoped runs continue to resolve provider config through the monorepo LLM config overlays,
then pass the selected scope into the PI subprocess so the project-local extension can render
the right runtime context.

`pnpm tooling -- agent commit` is the interactive commit entrypoint. It keeps the session open,
shows repository-policy and quality-gate state inside the PI UI, exposes remediation guidance when
checks fail, and stops at the approval boundary before writing the final commit.

Deterministic `cdk repo commit` stays separate on purpose. Use the repo command for stable,
exit-code-oriented automation and CI-friendly runs. Use `cdk agent commit` when an operator needs
to inspect failures, iterate on fixes, rerun checks, and approve the commit from the PI session.

The agent config surface also exposes provider profiles and action policies so interactive commit
sessions can choose a local or cloud backend intentionally:

```bash
pnpm tooling -- agent config show profiles
pnpm tooling -- agent config show action-policy commit
pnpm tooling -- agent config set profile-provider local-docs litellm
pnpm tooling -- agent config set profile-base-url local-docs http://host.containers.internal:13305/api/v1
pnpm tooling -- agent config set profile-default-model local-docs qwen2.5-coder-32b-instruct
pnpm tooling -- agent config set action-policy commit cloud-strong
pnpm tooling -- agent config set phase-policy commit failure-analysis local-docs
```

## Catalog

Use this command to inspect the registered maintenance surface without scraping terminal help output:

```bash
pnpm tooling -- catalog
```

## Migration Policy

Root `llm:*`, `docs:*`, and selected `sync:*` scripts remain as compatibility shims during migration, but they delegate through `pnpm tooling` rather than binding directly to package internals.