# PI LLM Gateway Cutover Plan

## Goal

`pi` is the canonical LLM runtime. PI is installed globally in the devcontainer and manages its own configuration under `~/.pi/agent/`. `cdk` remains the public control plane for repository operations. `@cfxdevkit/pi-customization` is the PI package that registers repo-specific commands, tools, and provider configuration.

## Current Architecture (Post-Cutover)

- `pi` is installed globally via `npm i -g @earendil-works/pi-coding-agent` in the devcontainer
- `~/.pi/agent/settings.json` manages PI packages, providers, skills, and prompts
- `~/.pi/agent/providers.json` provides endpoint, models, and policy overrides (merged from old `.pi/providers.json`)
- `@cfxdevkit/pi-customization` is a PI package installed via `pi install` into `~/.pi/agent/npm/`
- `pi` CLI replaces all `cdk agent` entrypoints (`/repo-*`, `/cdk`, `pi -p`, `pi --mode rpc`)
- `cdk` remains the public control plane for deterministic repository automation
- `llm-agents` owns repo-specific workflow logic only

## Migration Status

All migration slices are complete:

### Slice 1: Lemonade-First Config And Guidance ✅
- Provider config moved to `~/.pi/agent/providers.json`
- Docs updated to prefer `pi` over `cdk agent`

### Slice 2: PI-Owned Provider Configuration ✅
- `~/.pi/agent/providers.json` is the authority for provider selection
- No project-local `.pi/` config needed
- Provider resolution uses PI's built-in mechanism

### Slice 3: Route Generic LLM Work Through PI ✅
- `pi` CLI is the transport path for all LLM calls
- `/repo-commit`, `/repo-check`, `/repo-run`, `/repo-actions`, `/repo-status` are PI slash commands
- `pi -p` for single-shot prompts, `pi --mode rpc` for embedded sessions

### Slice 4: Refactor `llm-agents` To Domain Logic Only ✅
- Provider resolution and transport removed from `llm-agents`
- No direct completion calls remain in `llm-agents`
- Prompts, context building, policy selection, and workflow state remain in `llm-agents`

### Slice 5: Remove Compatibility Layers ✅
- `cdk agent` command removed from tooling-cli
- `@cfxdevkit/pi-agent` package removed entirely
- `.pi/` directory removed from repo (moved to `~/.pi/agent/`)
- `tooling-cli/src/agent-session/` removed
- LiteLLM-first help and config defaults removed

## Validation

All tests pass:
- `@cfxdevkit/llm-agents` typecheck + build + tests (42/42 passed)
- `@cfxdevkit/tooling-cli` typecheck + build + tests (20/20 passed)
- `@cfxdevkit/pi-customization` typecheck + build (52.73 kB)

## Guardrails

- Do not rewrite `resolveProvider()` or `defaultConfig()` until direct callers are reduced
- Keep `cdk` deterministic workflows scriptable and CI-safe
- PI is the only LLM runtime gateway, but `cdk` is the public CLI
