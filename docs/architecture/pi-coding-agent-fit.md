# PI Coding Agent Fit Assessment

## Current Status

PI is now integrated as the interactive agent runtime in the Conflux DevKit monorepo.

**What is implemented:**

- PI (`@earendil-works/pi-coding-agent`) is installed globally via devcontainer `npm i -g`
- All PI configuration lives in `~/.pi/agent/` (managed by `~/.pi/agent/settings.json`)
- `@cfxdevkit/pi-customization` is a proper PI package installed via `pi install` into `~/.pi/agent/npm/`
- PI extension registers repo commands (`/repo-*`), tools (`repo_agent_check`, `repo_run_action`, etc.), CDK commands (`/cdk`), and a custom OpenAI-compatible provider
- `~/.pi/agent/providers.json` provides endpoint, models, and policy overrides
- `cdk agent` and `cdk llm` have been removed from tooling-cli — they are deprecated in favor of `pi`
- PI slash commands and tools expose the shared repo action registry, a dedicated repo commit workflow command, and runtime workflow context in the operator UI
- The pi-customization extension resolves named provider profiles plus action and phase policies so PI commit sessions can select local or cloud backends intentionally

**What was removed:**

- `@cfxdevkit/pi-agent` TypeScript wrapper (replaced by `@cfxdevkit/pi-customization` PI package)
- `.pi/` directory (moved to `~/.pi/agent/`)
- `cdk agent interactive|print|rpc` commands (replaced by `pi` CLI)
- `cdk agent commit` (replaced by `/repo-commit` PI command)
- `tooling-cli/src/agent-session/` setup module
- `pi-extensions` package (merged into pi-customization)

## Recommendation

Adopt `pi` as the interactive agent runtime and TUI layer for repository-aware LLM work,
but do not make it the single root CLI for all repository operations.

The strongest fit is:

- keep `cdk` as the canonical repository automation entrypoint
- use `pi` for interactive and sessioned agent work
- replace the current `llm-tools` worker-launch bridge with the `@cfxdevkit/pi-customization` PI extension layer
- keep `llm-agents`, `docs-pipeline`, `arch-check`, and most of `llm-client` as domain/runtime packages

In short: `pi` fits the agent shell, provider/session/runtime UX, and TUI problem very well.
It does not fit the full deterministic repository control-plane as cleanly as the proposed `cdk` CLI.

## What PI Already Provides

External research shows that `@earendil-works/pi-coding-agent` already includes:

- interactive TUI mode
- non-interactive print mode
- JSON and RPC modes for embedding
- SDK APIs such as `createAgentSession()`
- built-in coding tools (`read`, `write`, `edit`, `bash`, `grep`, `find`, `ls`)
- extension hooks for tools, commands, provider interception, session events, and UI
- session persistence, branching, forking, and compaction
- custom provider registration for OpenAI-compatible, Anthropic-compatible, Google, and custom streaming APIs

That means `pi` is not just a terminal skin. It is already an agent harness with reusable runtime surfaces.

## Fit Against The Current Monorepo

### Strong fit: replace `llm-tools`

The current `llm-tools` package is mostly a process launcher that maps commands to worker scripts and then spawns `pnpm exec tsx ...`.

That makes it a weak long-term orchestration layer and a strong replacement candidate for `pi` extensions plus the `pi` SDK or RPC mode.

### Strong fit: add a real TUI and session model

The current monorepo has repository-aware LLM handlers, but no strong first-class sessioned agent shell.

`pi` would immediately add:

- model switching and scoped model selection
- session persistence and branching
- compaction behavior
- queued steering and follow-up messages
- extension-driven custom UI for repo workflows

This is a much better foundation for interactive maintenance and operator workflows than continuing to grow ad hoc worker CLIs.

### Strong fit: custom provider wrapper around current local stacks

The current provider layer resolves local Lemonade endpoints, LiteLLM, OpenAI-compatible endpoints, and GitHub Models.

`pi` can already register custom providers dynamically, including OpenAI-compatible endpoints with runtime model discovery. That gives a direct integration path for:

- LiteLLM
- local OpenAI-compatible servers
- proxy endpoints
- custom reasoning or context-window metadata

GitHub Copilot subscription auth is built in. GitHub Models API would likely need a custom provider extension if you want to preserve the exact current `GITHUB_TOKEN` workflow.

### Partial fit: keep `llm-agents` as the domain handler layer first

The current `llm-agents` package already owns repository-specific behaviors such as docs upkeep, review, and commit flows.

Those handlers should stay as the business-logic layer initially. The first migration should expose them through `pi` tools and commands instead of rewriting them into a new agent framework immediately.

This keeps the migration focused on replacing the orchestration shell rather than rewriting the domain workflows.

### Weak fit: replace the entire `cdk` root CLI

`pi` is optimized around agent interaction, sessions, tools, and extensions.

The proposed `cdk` refactor is optimized around a stable repository command taxonomy such as:

- `cdk docs ...`
- `cdk repo ...`
- `cdk llm ...`

Those are not the same concern.

Deterministic commands such as docs sync, docs validation, hotspot checks, secrets checks, and generation flows still need a scriptable, stable, CI-friendly root CLI. `pi` can support those workflows, but it should not become their only public command surface.

## Recommended Target Shape

### Control plane

Keep `cdk` as the single root CLI for repository operations.

Examples:

- `cdk docs sync all`
- `cdk docs enrich api`
- `cdk repo check hotspots`
- `cdk repo review`

### Agent layer

Use `pi` as the engine behind interactive agent workflows.

Preferred shapes:

- `pi` launches the interactive agent shell with repo extensions loaded
- `pi` supports `/repo-commit` for interactive commit operator loop
- `pi --mode rpc` exposes a hostable RPC session for future editor or dashboard integrations
- `pi -p` uses the `pi` SDK for single-shot prompts where that is simpler than maintaining a custom runtime

### Extension layer

The `@cfxdevkit/pi-customization` PI package exposes repo-specific capabilities:

- docs upkeep commands (via `/cdk` surface)
- review and commit flows (via `/repo-*` commands)
- model validation helpers (via `repo_agent_check` tool)
- provider registration for local and proxy endpoints plus action-policy-aware commit routing
- path protection and safety policies aligned with this monorepo
- custom TUI widgets for current repo workflows

### Domain packages

Keep the current domain packages behind the command surface:

- `docs-pipeline` remains the deterministic docs engine
- `arch-check` remains the deterministic validation and generation engine
- `llm-agents` remains the repo-specific LLM workflow layer
- `llm-client` remains the provider/runtime layer until and unless `pi-ai` is adopted later

## Migration Path

### Phase 1: adopt `pi` as a dev-facing shell only

- add a repo-local `pi` extension package
- wire local providers and model discovery into `pi.registerProvider()`
- expose current docs/review/commit/model commands as `pi` tools or slash commands
- keep `cdk` and all current deterministic entrypoints intact

This delivers interactive value quickly without destabilizing automation.

### Phase 2: collapse `llm-tools` into the `pi` extension layer

- move command registration and help out of `llm-tools`
- stop spawning worker scripts for normal interactive flows
- keep small compatibility shims while root scripts are migrated to `cdk`

### Phase 3: connect `cdk` and `pi`

- add `cdk agent` as the standard launch path (deprecated in favor of direct `pi` usage)
- optionally use `pi` RPC mode for host integrations
- optionally use the `pi` SDK for non-interactive agent tasks where that simplifies current custom code

### Phase 4: evaluate provider/runtime consolidation

Only after the command and extension migration stabilizes, evaluate whether parts of `llm-client` should be replaced by `pi-ai` or whether custom providers on top of the current provider layer remain the better choice.

This should be a later decision, not part of the first migration.

## Key Risks

### `pi` is intentionally not a full policy framework

Its philosophy is explicitly against baking in features like MCP, sub-agents, plan mode, permission popups, and background bash.

That is workable here because `pi` supports extensions, but it means some capabilities used in current agent workflows would need to stay in `cdk`, be recreated as extensions, or remain external.

### Not all current provider behaviors are one-to-one

OpenAI-compatible and proxy integrations map well.

GitHub Models API parity is less direct than the current dedicated provider path and would likely need a custom provider extension.

### Session and config ownership must be defined

`pi` normally stores auth, sessions, and packages under `~/.pi/agent` with optional project-local `.pi` overrides.

For this monorepo, project-local configuration conventions should be defined up front so repo behavior is reproducible.

### Deterministic and agent workflows must stay clearly separated

If `pi` becomes the only visible interface, the repository command surface will become harder to script and harder to reason about in CI.

That is why `cdk` should remain the public control plane.

## Concrete Conclusion

Use `pi` to replace the current interactive LLM harness and worker-orchestration shell.

Do not use `pi` as a replacement for the whole root repository CLI.

The right architecture is:

- `cdk` for repository command taxonomy and automation
- `pi` for interactive agent runtime, TUI, sessioning, and embedded/RPC agent flows
- `llm-agents` for repo-specific LLM business logic
- `docs-pipeline` and `arch-check` for deterministic engines
- `llm-client` kept initially, with later evaluation of whether `pi-ai` can absorb parts of it safely
