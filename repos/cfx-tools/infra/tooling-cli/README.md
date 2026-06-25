# @cfxdevkit/tooling-cli

Internal root CLI dispatcher for monorepo maintenance tooling.

## Purpose

This package owns the stable root maintenance entrypoint:

```bash
pnpm tooling -- <namespace> <command> [args]
```

It composes package-owned command registries into one grouped help surface and one machine-readable catalog for future TUI consumers.

## Current Namespaces

- `llm` — local LLM automation workflows from `@cfxdevkit/llm-agents`
- `docs` — docs pipeline workflows from `@cfxdevkit/docs-pipeline`

## Agent Workflows (Standalone)

PI interactive mode is installed globally in the devcontainer (`pi` binary on PATH).
Repository-specific PI customizations live in the `@cfxdevkit/pi-customization` package.

```bash
# Interactive session with repo commands
pi
# Then inside PI: /repo-actions, /repo-check, /repo-commit, /repo-run, /cdk status

# Print mode
pi -p "explain the changes"

# RPC mode
pi --mode rpc
```

### Standalone llm-agents CLI

The `@cfxdevkit/llm-agents` package provides standalone workflow commands:

```bash
pnpm --filter @cfxdevkit/llm-agents agent-smoke
pnpm --filter @cfxdevkit/llm-agents deterministic precommit
pnpm --filter @cfxdevkit/llm-agents exploratory validation
```

## Repository Commands

PI handles repository commands via the `@cfxdevkit/pi-customization` package:

- `/repo-actions` — list available shared repo workflows
- `/repo-check` — run full repo validation → OpenSpec change planning
- `/repo-commit` — interactive commit workflow with gate UI
- `/repo-run` — run a specific repo action
- `/repo-status` — show current provider/model context

## CDK Commands

```bash
/cdk status [--chain <id>] [--rpc <url>]
/cdk derive --mnemonic "<phrase>" | --generate [--count N]
/cdk generate [--strength 128|256]
/cdk contracts extract [--artifacts <dir>] [--out <dir>]
```

## Catalog

Use this command to inspect the registered maintenance surface without scraping terminal help output:

```bash
pnpm tooling -- catalog
```
