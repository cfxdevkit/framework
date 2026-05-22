## Why

The repository has already established `cdk` as the root control plane, but the current `cdk agent` surface is still a custom shim over `llm-agents` rather than a true PI-backed runtime. That leaves interactive sessions, print mode, RPC hosting, provider registration, and operator-grade TUI behavior split across custom terminal formatting and placeholder commands instead of a single agent runtime.

PI is a strong fit for the interactive agent shell, session lifecycle, extension model, TUI, and hostable runtime surfaces this monorepo now needs. The migration is timely because the repo already has the command taxonomy, unit-aware config model, HUD/failure-analysis patterns, and architectural direction needed to adopt PI without replacing the deterministic `cdk repo` and `cdk docs` control plane.

## What Changes

- Add a PI-backed agent runtime behind `cdk agent` for interactive, print, and RPC execution while keeping `cdk` as the root deterministic control plane.
- Introduce a project-local PI extension layer that owns repo-specific tools, commands, safety hooks, provider registration, and TUI state.
- Add a repo action runtime that exposes deterministic and exploratory workflows through one stable action contract instead of mode-specific shims.
- Bridge the existing `llm-client` configuration and unit-overlay model into PI provider and model registration so current provider strategy semantics remain intact.
- Re-express the current precommit/review HUD, failure guidance, and unit-aware execution context through PI widgets, statuses, and structured tool rendering.
- Shift interactive orchestration responsibilities away from the current `llm-tools` worker-launch bridge while preserving package compatibility during migration.

## Capabilities

### New Capabilities
- `pi-agent-runtime`: A PI-backed runtime for `cdk agent` that supports interactive, print, and RPC modes with project-local settings, resources, and session behavior.
- `pi-provider-bridge`: A bridge that registers providers and model metadata in PI from the existing `llm-client` configuration, including repo-wide defaults and unit-scoped overlays.
- `pi-repo-actions`: A stable action registry that maps deterministic and exploratory repo workflows into PI commands and tools without conflating workflow semantics with PI runtime modes.
- `pi-operator-ui`: A PI-native operator HUD that renders execution context, gate results, failure guidance, and action progress through widgets, status/footer state, and custom tool rendering.

### Modified Capabilities
- `llm-agents`: Existing repo workflows will change from CLI-first orchestration to PI-compatible action and tool execution contracts with structured outputs.
- `llm-client`: Provider resolution and model metadata behavior will change to support PI registration, scoped runtime loading, and hostable runtime consumers.
- `llm-tools-in-cfx-tools`: The interactive orchestration role of `llm-tools` will change from worker-launch glue to a PI-backed runtime/compatibility layer while keeping the package in `repos/cfx-tools/infra/`.

## Impact

Affected areas include `repos/cfx-tools/infra/tooling-cli`, `repos/cfx-tools/infra/llm-agents`, `repos/cfx-tools/infra/llm-client`, and `repos/cfx-tools/infra/llm-tools`, plus repo-local configuration under `artifacts/llm/config/` and new project-local PI resources under `.pi/`. The change will add PI runtime dependencies, introduce a repo-local PI integration package or extension package under `repos/cfx-tools/infra/`, and update the user-facing behavior of `cdk agent interactive`, `cdk agent print`, and `cdk agent rpc` while preserving deterministic `cdk repo` and `cdk docs` flows.