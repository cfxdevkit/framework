# tooling-command-registry Specification

## Purpose
TBD - created by archiving change unify-root-tooling-cli. Update Purpose after archive.
## Requirements
### Requirement: Participating tooling packages SHALL publish structured command definitions
Any tooling package that participates in the root maintenance surface SHALL expose a structured command registry that declares its namespace, command names, descriptions, and execution contract in a machine-readable form.

#### Scenario: Root dispatcher loads commands from a tooling package
- **WHEN** the root dispatcher imports command metadata from a participating tooling package
- **THEN** it SHALL receive structured command definitions without scraping CLI help text

#### Scenario: Package CLI joins the shared maintenance surface
- **WHEN** a tooling package is added to the root maintenance surface
- **THEN** it SHALL expose command metadata using the shared registry contract before the root dispatcher registers its commands

### Requirement: The command catalog SHALL be available for CLI help and TUI discovery
The system SHALL expose a machine-readable command catalog built from the shared registries so interactive and non-interactive consumers can discover supported maintenance commands.

#### Scenario: CLI consumer requests command catalog output
- **WHEN** a consumer requests the root tooling catalog in machine-readable form
- **THEN** the system SHALL return the registered namespaces, commands, descriptions, and invocation metadata required for discovery

#### Scenario: TUI consumes maintenance command metadata
- **WHEN** a future TUI enumerates the maintenance command surface
- **THEN** it SHALL be able to discover supported namespaces and commands from the catalog without parsing terminal help output

### Requirement: Package tooling runners SHALL support root dispatch without hardcoded process entry assumptions
Participating tooling CLIs SHALL expose command runners that can be invoked by the root dispatcher through typed arguments instead of depending only on `process.argv` parsing inside the bin wrapper.

#### Scenario: Root dispatcher invokes a package-owned command runner
- **WHEN** the root dispatcher executes a registered package command
- **THEN** the package tooling surface SHALL accept forwarded arguments through its exported runner contract

#### Scenario: Package bin wrapper remains present
- **WHEN** a tooling package still provides its own executable bin command
- **THEN** the bin wrapper SHALL remain a thin adapter over the same shared runner contract used by the root dispatcher

