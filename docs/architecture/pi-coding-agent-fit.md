# Pi Coding Agent Fit Assessment

## Current Status

The recommended integration path in this document is now partially implemented.

Current shipped shape:

- `cdk agent interactive|print|rpc` delegates into `@cfxdevkit/pi-agent`
- `cdk agent commit` delegates into a PI-backed interactive commit workflow that keeps remediation and approval inside the session
- `@cfxdevkit/pi-agent` launches `pi` from the repository root so project-local `.pi/` resources resolve correctly
- `.pi/extensions/repo-agent.ts` registers the project-local PI extension from the `pi-agent` package source
- scoped `cdk agent --scope <unit> ...` runs resolve the matching `artifacts/llm/config/units/<unit>.json` overlay and pass the scope into the PI subprocess
- PI slash commands and tools now expose the shared repo action registry, a dedicated repo commit workflow command, and runtime workflow context in the operator UI
- `@cfxdevkit/llm-client` now resolves named provider profiles plus action and phase policies so PI commit sessions can select local or cloud backends intentionally
- `@cfxdevkit/llm-tools` keeps compatibility entrypoints for PI-backed `interactive`, `print`, and `rpc` modes while the root control plane stays on `cdk`

What remains after this slice is representative smoke validation of live `repo commit`, `agent commit`, and policy-routed local-versus-cloud runs.

## Recommendation

Adopt `pi` as the interactive agent runtime and TUI layer for repository-aware LLM work,
but do not make it the single root CLI for all repository operations.

The strongest fit is:

- keep `cdk` as the canonical repository automation entrypoint
- use `pi` under `cdk agent` or `cdk tui` for interactive and sessioned agent work
- replace the current `llm-tools` worker-launch bridge with a project-local `pi` extension layer
- keep `llm-agents`, `docs-pipeline`, `arch-check`, and most of `llm-client` as domain/runtime packages during the first migration

In short: `pi` fits the agent shell, provider/session/runtime UX, and TUI problem very well.
It does not fit the full deterministic repository control-plane as cleanly as the proposed `cdk` CLI.

## What Pi Already Provides

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
- `cdk llm validate-models`
- `cdk agent`

### Agent layer

Use `pi` as the engine behind interactive agent workflows.

Preferred shapes:

- `cdk agent` launches `pi` in project-local mode with repo extensions loaded
- `cdk agent commit` launches the interactive repo commit operator loop while `cdk repo commit` remains deterministic
- `cdk agent rpc` exposes a hostable RPC session for future editor or dashboard integrations
- `cdk agent print` or `cdk llm ask` uses the `pi` SDK for single-shot prompts where that is simpler than maintaining a custom runtime

### Extension layer

Create a project-local `pi` extension package that exposes repo-specific capabilities:

- docs upkeep commands
- review and commit flows
- model validation helpers
- provider registration for local and proxy endpoints plus action-policy-aware commit routing
- path protection and safety policies aligned with this monorepo
- custom TUI widgets for current repo workflows

This is now implemented through `repos/cfx-tools/infra/pi-agent` plus the repo-local entrypoint in `.pi/extensions/repo-agent.ts`.

This extension layer is the natural replacement for most of `llm-tools`.

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

- add `cdk agent` as the standard launch path
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
