# LLM Automation Agents

This repository currently implements deterministic upkeep agents only. They are
the first slice of the LLM automation plan and do not fine-tune, train, publish,
deploy, rotate secrets, or commit changes.

## Command Surfaces

The root CLI has two primary surfaces:

- `cdk` for repository maintenance, validation, generation, and commit workflow.
- `pi` for interactive and workflow-oriented agent execution.

Convenience aliases are available for the most common repo and agent surfaces:

```sh
pnpm run repo
pnpm run repo:check -- hotspots
pnpm run repo:generate -- api
pnpm run repo:review
pnpm run repo:precommit
pnpm run repo:check -- eval
```

Primary entrypoints from the repository root:

```sh
pnpm run cdk -- repo check hotspots
pnpm run cdk -- repo check docs
pnpm run cdk -- repo check ci
pnpm run cdk -- repo check corpus
pnpm run cdk -- repo arch-check
pnpm run cdk -- repo review
pnpm run cdk -- repo precommit
pnpm run cdk -- repo check eval -- --dry-run
pnpm run cdk -- deterministics models
pnpm run cdk -- deterministics precommit
pnpm run cdk -- exploratory actions
pnpm run cdk -- exploratory validation
```

Legacy `pnpm run llm:*` aliases are deprecated. `pnpm run docs:wiki` is the
canonical entrypoint for docs wiki generation.

Generated outputs are written under `artifacts/llm/`, which is ignored by git.
Commit only small schemas, manifests, or report excerpts intentionally.

## Agent Responsibilities

| Agent | Purpose | Output |
|-------|---------|--------|
| `cdk repo check corpus` | Build safe repository metadata for retrieval and later eval seeds | `artifacts/llm/corpus/*.jsonl` |
| `cdk repo check ci` | Check CI/CD workflow, docs image, release, and VPS deploy wiring | `artifacts/llm/reports/ci-cd.*` |
| `cdk repo check docs` | Detect broken documentation references, Moon registration drift, package export drift, and current/planned wording risk | `artifacts/llm/reports/docs-alignment.*` |
| `cdk repo review` | Inspect current git changes and suggest targeted validation commands | `artifacts/llm/reports/review.*` |
| `cdk repo check hotspots` | Scan source file size and recent churn against the framework component budget | `artifacts/llm/reports/code-hotspots.*` |
| `cdk repo check eval` | Summarize deterministic gates from the generated reports | `artifacts/llm/reports/eval.*` |

## PI Interactive Agent

PI (`@earendil-works/pi-coding-agent`) is installed globally in the devcontainer.
All PI configuration lives in `~/.pi/agent/` (not in the repo).

### Provider Configuration

Provider config is managed by PI in `~/.pi/agent/providers.json`. The checked-in
config template at `.pi/providers.json` is copied to `~/.pi/agent/providers.json`
during devcontainer post-create.

The local backend defaults to the Headroom proxy on `http://localhost:28787/v1/`,
which fronts the host Lemonade server while keeping Headroom in the path.

PI auto-discovers a local provider at
`http://localhost:13305/`, `http://127.0.0.1:13305/`,
`http://host.docker.internal:13305/`, `http://host.containers.internal:13305/`,
then `http://127.0.0.1:8000/`, unless `LEMONADE_URL` or `LEMONADE_BASE_URL` is
set.

Inside the Linux devcontainer, Lemonade is expected to run on the host
workstation and the container uses host networking, so `http://localhost:13305/`
should resolve to the same service inside and outside the container. The CLI also
probes `host.docker.internal` and `host.containers.internal` for container
backends that expose host aliases. After rebuilding or reopening the
devcontainer, run `pi` then `/repo-status` to verify connectivity.

### PI Commands

Interactive commands inside `pi`:

```
/repo-check [--dry-run] [--create-branch] [--quick]
/repo-commit [--quick] [--model <id>] [prompt]
/repo-run <action> [--quick] [--model <id>] [prompt]
/repo-actions [--deterministic|exploratory]
/cdk status [--chain <id|name>] [--rpc <url>]
/cdk derive --mnemonic "<phrase>" | --generate [--count N]
/cdk generate [--strength 128|256]
/cdk contracts extract [--artifacts <dir>] [--out <dir>]
```

Print mode (single-shot prompt):

```sh
pi -p "Which validation commands should I run for a docs-only change?"
```

RPC mode (for host integrations):

```sh
pi --mode rpc
```

### Available Repo Actions

| Action | Purpose |
|--------|---------|
| `docs-upkeep` | Use docs alignment reports and docs context to recommend minimal documentation fixes |
| `review` | Review the current git diff with repo security and contribution context |
| `validation` | Pick targeted validation commands for the current change set |
| `changeset` | Review changed publishable packages for required Changesets, bump levels, and release notes |
| `release-readiness` | Review Changesets, release workflows, and npm publish provenance before releasing |
| `ci-cd` | Review GitHub Actions, security gates, docs image publishing, and VPS deploy wiring |
| `docs-pipeline` | Review wiki sync, docs build, Docker image, and docs deploy readiness |

Provider configuration is stored in `~/.pi/agent/providers.json`,
which is managed by PI and ignored by git.
LLM outputs are written to `artifacts/llm/reports/llm-*.md`.

## Current Limits

- The agents use deterministic scans and local repository state only.
- Lemonade Server is optional for now; unavailable local inference records an
  `unavailable` report instead of failing the whole no-training loop. When
  available, the agent records discovered model ids, labels, recipes, and sizes.
- Local LLM CLI actions ask the model for recommendations only; they do not apply
  patches, run deployment commands, publish packages, or commit changes.
- Dataset generation and fine-tuning remain outside this repo automation surface.
- The review agent checks uncommitted changes. For committed ranges, compare or
  checkout the desired diff before running it.
- The documentation agent intentionally reports warnings rather than rewriting
  docs automatically.

## Promotion Criteria

Before adding fine-tuning or autonomous patching, these agents should reliably:

- find stale docs and missing package registration without noisy false positives,
- identify security-sensitive changes and name useful validation commands,
- produce stable corpus metadata that excludes generated folders and secret-like
  paths,
- run cleanly in the Node 24 devcontainer and CI environment,
- record Lemonade Server availability and model inventory on the target machine.
