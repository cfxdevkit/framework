# LLM Automation Agents

This repository currently implements deterministic upkeep agents only. They are
the first slice of the LLM automation plan and do not fine-tune, train, publish,
deploy, rotate secrets, or commit changes.

## Commands

Run these from the repository root:

```sh
pnpm run llm:all
pnpm run llm:models
pnpm run llm:actions
pnpm run llm:config -- show
pnpm run llm:action -- review
pnpm run llm:ask -- --quick "Where should a docs alignment scanner live?"
pnpm run check:corpus
pnpm run check:ci
pnpm run check:docs
pnpm run llm:review
pnpm run check:hotspots
pnpm run check:eval
pnpm run llm:changeset
pnpm run llm:release
pnpm run llm:ci-cd
pnpm run llm:docs-pipeline
```

Generated outputs are written under `artifacts/llm/`, which is ignored by git.
Commit only small schemas, manifests, or report excerpts intentionally.

## Agent Responsibilities

| Agent | Purpose | Output |
|-------|---------|--------|
| `check:corpus` | Build safe repository metadata for retrieval and later eval seeds | `artifacts/llm/corpus/*.jsonl` |
| `check:ci` | Check CI/CD workflow, docs image, release, and VPS deploy wiring | `artifacts/llm/reports/ci-cd.*` |
| `check:docs` | Detect broken documentation references, Moon registration drift, package export drift, and current/planned wording risk | `artifacts/llm/reports/docs-alignment.*` |
| `llm:review` | Inspect current git changes and suggest targeted validation commands | `artifacts/llm/reports/review.*` |
| `check:hotspots` | Scan source file size and recent churn against the framework component budget | `artifacts/llm/reports/code-hotspots.*` |
| `check:eval` | Summarize deterministic gates from the generated reports | `artifacts/llm/reports/eval.*` |

## Local LLM CLI

`@cfxdevkit/llm-tools` in `repos/cfx-tools/infra/llm-tools` provides a local CLI for using
provider-backed models against repository upkeep tasks. The checked-in config currently points at a LiteLLM proxy URL,
which can front the same local server that was previously addressed directly. Without an explicit config,
the resolver checks LiteLLM first, then legacy Lemonade-compatible fallbacks.

It auto-discovers a local provider at
`http://localhost:13305/`, `http://127.0.0.1:13305/`,
`http://host.docker.internal:13305/`, `http://host.containers.internal:13305/`,
then `http://127.0.0.1:8000/`, unless `LEMONADE_URL` or `LEMONADE_BASE_URL` is
set.

Inside the Linux devcontainer, Lemonade is expected to run on the host
workstation and the container uses host networking, so `http://localhost:13305/`
should resolve to the same service inside and outside the container. The CLI also
probes `host.docker.internal` and `host.containers.internal` for container
backends that expose host aliases. After rebuilding or reopening the
devcontainer, run `pnpm run llm:models` to verify connectivity.

Useful commands:

```sh
pnpm run llm:models
pnpm run llm:config -- set provider litellm
pnpm run llm:config -- set base-url http://host.containers.internal:13305/api/v1
pnpm run llm:actions
pnpm run llm:config -- set default-model Qwen3-Coder-Next-GGUF
pnpm run llm:config -- set action review Qwen3-Coder-Next-GGUF
pnpm run llm:action -- docs-upkeep
pnpm run llm:action -- review
pnpm run llm:changeset
pnpm run llm:release
pnpm run llm:ci-cd
pnpm run llm:docs-pipeline
pnpm run llm:ask -- --quick "Which validation commands should I run for a docs-only change?"
```

Add `--quick` to `llm:ask` or `llm:action` for a smaller context window and a
short response cap. This is useful for smoke tests on large local models.

The available repo actions are:

| Action | Purpose |
|--------|---------|
| `docs-upkeep` | Use docs alignment reports and docs context to recommend minimal documentation fixes |
| `review` | Review the current git diff with repo security and contribution context |
| `validation` | Pick targeted validation commands for the current change set |
| `changeset` | Review changed publishable packages for required Changesets, bump levels, and release notes |
| `release-readiness` | Review Changesets, release workflows, and npm publish provenance before releasing |
| `ci-cd` | Review GitHub Actions, security gates, docs image publishing, and VPS deploy wiring |
| `docs-pipeline` | Review wiki sync, docs build, Docker image, and docs deploy readiness |

Local provider-aware configuration is written to `artifacts/llm/config/llm.json`,
which is ignored by git. Reads still fall back to the legacy `artifacts/llm/config/lemonade.json` name.
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
