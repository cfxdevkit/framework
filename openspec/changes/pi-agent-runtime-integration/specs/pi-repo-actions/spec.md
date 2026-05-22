## ADDED Requirements

### Requirement: Repo workflows SHALL be exposed through a typed action registry
The system SHALL define repo workflows through a typed action registry that PI and CLI compatibility layers can consume without scraping help text.

#### Scenario: Runtime enumerates repo actions
- **WHEN** the PI runtime requests available repo workflows
- **THEN** it SHALL receive action definitions with identifiers, titles, descriptions, workflow mode, and context metadata

#### Scenario: CLI compatibility layer uses the same registry
- **WHEN** a compatibility CLI command lists or resolves repo actions
- **THEN** it SHALL read from the same typed action registry used by the PI runtime

### Requirement: Repo actions SHALL preserve deterministic and exploratory workflow semantics
The system SHALL carry deterministic-versus-exploratory workflow intent as action metadata instead of encoding that distinction only in CLI command names.

#### Scenario: Deterministic action is marked constrained
- **WHEN** a runtime inspects an action such as precommit or docs upkeep that is defined as deterministic
- **THEN** the action metadata SHALL identify it as deterministic so the runtime can apply constrained defaults and UI labeling

#### Scenario: Exploratory action is marked exploratory
- **WHEN** a runtime inspects an action such as review or commit that is defined as exploratory
- **THEN** the action metadata SHALL identify it as exploratory so the runtime can apply the broader workflow contract intentionally

### Requirement: Repo action execution SHALL support structured results
The system SHALL allow repo actions to return structured execution payloads in addition to human-readable output so PI tools and UI can render workflow state.

#### Scenario: Precommit action returns structured workflow state
- **WHEN** a maintainer runs the precommit workflow through the PI runtime
- **THEN** the action result SHALL include structured execution-context and gate-report data in addition to a human-readable summary

#### Scenario: Review action returns structured workflow state
- **WHEN** a maintainer runs the review workflow through the PI runtime
- **THEN** the action result SHALL include structured findings or execution metadata that PI can render without re-parsing plain text