## Why

`showcase-local` already has the right architecture, but dead helper layers and abandoned guide concepts keep obscuring the real control flow. Tightening the workspace around its actual panel-driven model will reduce future implementation drift and make the keeper app safe to extend.

## What Changes

- Remove dead or misleading `showcase-local` code paths that no longer participate in the workspace runtime.
- Preserve the live workspace architecture: shared state and action wiring through `ShowcaseWorkspacePanelsProps` and the top-level orchestrator.
- Split live snippet constants from deprecated guide metadata, trim unused helpers, and verify the active panel registry remains complete.

## Capabilities

### New Capabilities
- `showcase-local-workspace`: defines the supported workspace-panel architecture and the cleanup rules for deprecated guide and helper code in the keeper local showcase.

### Modified Capabilities
- None.

## Impact

- Affected code: `projects/examples/apps/showcase-local/app/`, `lib/`, and workspace runtime wiring.
- Affected systems: panel registration, keystore runtime helpers, code snippet rendering, and release documentation for the local showcase architecture.
