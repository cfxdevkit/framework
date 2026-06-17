## Why

The codebase currently suffers from file sprawl, with 113 files scattered across 38 kebab-case groups, leading to reduced module cohesion and increased maintenance overhead. Consolidating these into single kebab-case modules will streamline imports, improve developer navigation, and resolve the structural warning across multiple packages.

## What Changes

- Consolidate 113 files across 38 kebab-case groups into single, cohesive kebab-case modules.
- Update internal import paths and barrel re-exports in `tooling-cli`, `arch-check`, `llm-agents`, `pi-agent`, and `react-ui` packages to reflect the new module structure.
- Remove the `kebab-groups` structural warning by aligning file organization with the kebab-case convention.

## Capabilities

### New Capabilities
- `consolidate-kebab-groups`: Establishes a standardized module consolidation strategy to merge related kebab-case files into single cohesive modules, improving codebase organization and import efficiency.

### Modified Capabilities
- None

## Impact

- **Affected Code**: `repos/cfx-tools/infra/tooling-cli/src`, `repos/cfx-tools/packages/arch-check/src/bin`, `repos/cfx-tools/infra/llm-agents/workers/docs`, `repos/cfx-tools/infra/pi-agent/src`, `repos/cfx-ui/packages/react/src/keystore`.
- **APIs/Dependencies**: Internal module imports and re-exports will be updated; no external API changes.
- **Systems**: Build tooling and linting pipelines will reflect the new file structure, resolving the `kebab-groups` warning and improving static analysis performance.
