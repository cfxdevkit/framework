# cfx-llm

**Tier 1 — local LLM and AI-assisted developer automation.** Carve-out target per [ADR-0003](../../docs/adr/0003-multi-repo-split.md).

## Packages

| Package | npm | Surface |
|---------|-----|---------|
| `llm-client` | `@cfxdevkit/llm-client` | Typed provider chain for Lemonade, OpenAI-compatible endpoints, and GitHub Models |
| `llm-agents` | `@cfxdevkit/llm-agents` | Orchestrated developer workflows for commit, docs, test upkeep, and deterministic review |
| `llm-tools` | `@cfxdevkit/llm-tools` | CLI dispatcher that routes root `llm:*` scripts into `llm-client` and `llm-agents` |

## Why standalone

LLM automation changes quickly and carries local model, prompt, corpus, and agent workflow concerns that should not be mixed into general developer tooling. Keeping it in its own slice makes it easier to carve out, iterate on, and audit without turning `cfx-tools` into a catch-all.

## Boundaries

- **MAY** read repository source, docs, git metadata, GitNexus output, and generated LLM artifacts.
- **MAY** orchestrate local developer commands such as lint, typecheck, tests, docs checks, and commit preparation.
- **MUST NOT** become a runtime dependency of deployed packages or apps.
- **MUST** keep local LLM, prompt, and corpus logic inside this slice rather than root scripts.
