## ADDED Requirements

### Requirement: `llm-tools` SHALL delegate PI-backed modes to the PI runtime package
During the migration, `llm-tools` SHALL keep compatibility entrypoints available while delegating PI-backed runtime modes to the dedicated PI runtime package.

#### Scenario: Compatibility interactive entrypoint delegates to PI
- **WHEN** a maintainer invokes the compatibility interactive agent entrypoint exposed by `llm-tools`
- **THEN** `llm-tools` SHALL delegate to the PI runtime package instead of launching the legacy worker shim directly

#### Scenario: Compatibility print or RPC entrypoint delegates to PI
- **WHEN** a maintainer invokes a compatibility print or RPC entrypoint exposed by `llm-tools`
- **THEN** `llm-tools` SHALL delegate to the PI runtime package instead of documenting or spawning a placeholder path

### Requirement: Migration compatibility SHALL preserve existing script-level entrypoints
The migration SHALL preserve script-level compatibility for existing `llm-tools` entrypoints while ownership moves behind the PI runtime package.

#### Scenario: Existing compatibility command still resolves
- **WHEN** an existing script or alias calls a retained `llm-tools` entrypoint during the migration window
- **THEN** the command SHALL continue to resolve successfully through the delegated runtime path