## ADDED Requirements

### Requirement: `cdk agent` SHALL use a PI-backed runtime for interactive, print, and RPC modes
The system SHALL route `cdk agent interactive`, `cdk agent print`, and `cdk agent rpc` through a repo-configured PI runtime instead of the current mode-aware shim and placeholder handlers.

#### Scenario: Interactive mode boots a PI session
- **WHEN** a maintainer runs `cdk agent interactive` from the repository root
- **THEN** the system SHALL start a PI interactive session with the repo-local extension set, prompts, and settings loaded

#### Scenario: Print mode uses the PI non-interactive runtime
- **WHEN** a maintainer runs `cdk agent print -- <prompt>`
- **THEN** the system SHALL execute the prompt through PI print mode and emit the final assistant response without starting the interactive TUI

#### Scenario: RPC mode starts the hostable runtime
- **WHEN** a maintainer runs `cdk agent rpc`
- **THEN** the system SHALL start a hostable PI runtime that exposes the same repo-local tools, providers, and prompts used by interactive mode

### Requirement: Project-local PI resources SHALL define repo behavior
The system SHALL load repo-specific PI resources from the repository so agent behavior is reproducible without copying global settings into source control.

#### Scenario: Repo-local settings are loaded
- **WHEN** the PI runtime starts from the repository root
- **THEN** it SHALL load the project-local `.pi/` resources required for settings, prompts, skills, and extension registration

#### Scenario: Global user state remains separate
- **WHEN** a maintainer has existing global PI auth or session state
- **THEN** the repo-local runtime SHALL use that user-scoped state without writing credentials or personal session history into the repository

### Requirement: Scoped agent runs SHALL preserve monorepo unit selection
The PI runtime SHALL honor the same unit-scoping model already used by `cdk agent` and `cdk repo`.

#### Scenario: Scoped interactive session uses unit overlay
- **WHEN** a maintainer runs `cdk agent --scope docs interactive`
- **THEN** the PI runtime SHALL load the selected unit overlay and expose the scoped execution context to the session

#### Scenario: Scoped print request uses unit overlay
- **WHEN** a maintainer runs `cdk agent --scope cas print -- <prompt>`
- **THEN** the PI runtime SHALL resolve providers, prompts, and defaults using the selected unit overlay before executing the request