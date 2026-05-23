# agent-model-policy-registry Specification

## Purpose
TBD - created by archiving change interactive-agent-commit-and-model-policies. Update Purpose after archive.
## Requirements
### Requirement: The runtime config SHALL support named provider profiles
The system SHALL support named provider profiles so agent workflows can target local or cloud backends intentionally.

#### Scenario: Local provider profile is configured
- **WHEN** the config defines a local profile for a LiteLLM/Lemonade-backed model
- **THEN** runtimes SHALL be able to resolve that profile as a first-class backend selection

#### Scenario: Cloud provider profile is configured
- **WHEN** the config defines a cloud profile for a remote provider or gateway-backed remote model
- **THEN** runtimes SHALL be able to resolve that profile as a first-class backend selection

### Requirement: Agent actions SHALL support profile-based model policies
The system SHALL support mapping agent actions to provider profiles so different work categories can use different backends by default.

#### Scenario: Documentation upkeep prefers a local profile
- **WHEN** the policy registry maps a documentation or housekeeping action to a local profile
- **THEN** the runtime SHALL select that local profile by default for the action

#### Scenario: Refactoring or development prefers a cloud profile
- **WHEN** the policy registry maps a refactoring or development-oriented action to a cloud profile
- **THEN** the runtime SHALL select that cloud profile by default for the action

### Requirement: Compound workflows SHALL support phase-specific profile overrides
The system SHALL support overriding the default action profile for specific workflow phases.

#### Scenario: Commit failure analysis uses a stronger profile
- **WHEN** the commit workflow defines a phase policy for failure analysis
- **THEN** the runtime SHALL use the configured phase profile even if the broader action defaults to another profile

#### Scenario: Commit message generation uses the action default when no phase override exists
- **WHEN** a commit workflow phase has no explicit phase policy override
- **THEN** the runtime SHALL fall back to the action-level profile selection

### Requirement: Existing default provider/model behavior SHALL remain the fallback
The system SHALL preserve today’s default provider/model resolution behavior when no explicit profile or policy is configured.

#### Scenario: No action policy is configured
- **WHEN** an action executes without a matching policy binding
- **THEN** the runtime SHALL use the current repo-default provider/model resolution path

#### Scenario: Partial profile registry is configured
- **WHEN** some actions have explicit policies and others do not
- **THEN** the runtime SHALL apply configured policies where present and current default behavior elsewhere

