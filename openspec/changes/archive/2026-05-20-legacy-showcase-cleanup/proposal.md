## Why

The release plan still carries six retired example surfaces and one placeholder package that no longer represent the framework's supported architecture. Keeping them in the workspace after the keeper apps are consolidated will preserve stale references, inflate maintenance cost, and mislead future implementation work.

## What Changes

- Remove the legacy example applications `showcase`, `showcase-browser`, `showcase-stack`, `showcase-gateway`, `showcase-backend`, and `hardware-wallet-showcase` once their required coverage is ported or superseded.
- Remove the placeholder `@cfxdevkit/hardware-bridge` package instead of carrying it as a stub.
- Clean workspace, Moon, infrastructure, and documentation references so only the supported showcase surfaces remain.

## Capabilities

### New Capabilities
- `legacy-showcase-retirement`: retires unsupported example apps and the unused hardware-bridge stub from the active workspace and configuration surface.
- `hardware-bridge-removal`: removes the unused hardware-bridge stub from the active workspace.

### Modified Capabilities
- None.

## Impact

- Affected code: `projects/examples/apps/`, `repos/cfx-domain/packages/hardware-bridge/`, workspace config files, top-level docs, and infrastructure references.
- Affected systems: pnpm workspace membership, Moon package registration, release docs, and example app discovery.
