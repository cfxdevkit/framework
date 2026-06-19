## Why

The repository has 11 independent CLI binaries spread across 3 git repos with **three entry points** for repo operations (`pnpm run build`, `cdk repo build`, `pnpm run check`), 20+ deprecated hidden commands in `cdk llm`, and **LLM operations scattered** across `cdk agent`, `cdk llm`, `cdk docs enrich`, and `cdk repo review`. The command dispatcher (`cdk`) calls the task runner (moon) — backwards wiring. Developers must memorize four different commands for four flavors of the same thing.

**This is a consolidation, not a feature addition.** The goal is a single entrypoint (`moon run`) for all repo-wide operations and LLM-based workflows, with `cdk` narrowed to framework-level commands that developers run directly against framework packages.

## What Changes

### Scope of `cdk` binary (stays `@cfxdevkit/tooling-cli` package, binary name `cdk`)

**REMOVED from `cdk`:**
- `cdk repo` namespace (12 subcommands: build, run, gate, check, merge, generate, arch-check, units, review, precommit, commit)
- `cdk agent` namespace (13 subcommands: smoke, check, merge, endpoints, config, modes, status, chat, commit, rpc, print, deterministic, exploratory)
- `cdk llm` namespace (20+ deprecated hidden commands — all redirect to `agent`)
- `cdk docs` LLM enrichment commands (sync, validate, enrich, wiki, review — keep only `generate`/`validate`)

**KEPT in `cdk`:**
- `cdk build [pkg]`, `test [pkg]`, `lint [pkg]`, `typecheck [pkg]`, `check [pkg]`, `generate [target]` — framework package operations
- `cdk contracts extract/compile` — Hardhat artifact operations
- `cdk devnode [start|stop|status]` — local Conflux dev node lifecycle
- `cdk devnode:serve` — devnode-server control plane
- `cdk sign message/typed-data` — headless signing
- `cdk signer setup/status/list/use` — signer identity management
- `cdk mcp start` — MCP server for AI agents
- `cdk derive [flags]`, `generate-mnemonic [strength]` — account derivation
- `cdk status [--chain]` — chain status check
- `cdk docs generate [target]`, `validate [target]` — deterministic docs (no LLM)

### NEW: `moon run` as single repo entrypoint

Every `cdk repo`, `cdk agent`, `cdk docs` (enrichment), and standalone CLI command gets a moon task:
- `moon run :build`, `:lint`, `:test`, `:typecheck`, `:check`, `:clean` — existing, expanded
- `moon run repo:build`, `repo:run`, `repo:gate`, `repo:check`, `repo:generate`, `repo:merge`, `repo:review`, `repo:precommit`, `repo:commit`, `repo:units` — repo operations
- `moon run agent:chat`, `agent:smoke`, `agent:check`, `agent:merge`, `agent:config`, `agent:deterministic:*`, `agent:exploratory:*` — agent/LLM ops
- `moon run docs:sync`, `docs:enrich`, `docs:wiki`, `docs:validate` — docs pipeline
- `moon run devnode:start/stop/status/serve` — devnode lifecycle
- `moon run sign:message`, `sign:typed-data`, `signer:*` — signing ops
- `moon run scaffold:new`, `scaffold:list` — scaffolding
- `moon run contracts:extract` — codegen
- `moon run mcp:start`, `mcp:stop` — MCP server
- `moon run cas:setup` — CAS setup
- `moon run arch-check` — architecture validation

## Capabilities

### Modified Capabilities

- `cdk-cli`: Narrows `cdk` binary scope from 7 namespaces (~50 commands) to ~20 framework-scoped commands. Removes `repo`, `agent`, `llm` namespaces entirely.
- `moon-entrypoint`: Establishes `moon run` as the single entrypoint for all repository-wide operations and LLM-based workflows. Adds 30+ new moon tasks.
- `cli-consolidation`: Eliminates 3 entry points for repo ops, removes 20+ deprecated hidden commands, unifies LLM operations under `moon run agent:*`.

## Impact

- **Affected packages**: `@cfxdevkit/tooling-cli` (command definitions, namespaces), all moon.yml files (new task definitions), root `package.json` (scripts)
- **No external API changes**: All binaries remain callable independently; moon tasks are internal orchestration
- **Breaking**: `cdk repo *`, `cdk agent *`, `cdk llm *` commands removed. Migrate to `moon run <task>` equivalents.
- **Dependencies**: No new dependencies. Existing tooling-cli clipanion dependency unchanged.
- **CI/CD**: GitHub Actions workflows using `cdk repo` or `cdk agent` commands need migration to `moon run` equivalents.
