# agent-model-policy-registry Specification

## Purpose
Define how the `llm-agents` runtime maps agent actions to models and provider profiles. The `actions` map (action-name → model-ID) is the first-class binding. `actionPolicies` with per-phase overrides is the future extension. `providerProfiles` enables local ↔ cloud backend switching per action.
## Requirements
### Requirement: The runtime config SHALL support named provider profiles
The system SHALL support named provider profiles so agent workflows can target local or cloud backends intentionally.

#### Scenario: Local provider profile is configured
- **WHEN** the config defines a local profile for a LiteLLM/Lemonade-backed model
- **THEN** runtimes SHALL be able to resolve that profile as a first-class backend selection

#### Scenario: Cloud provider profile is configured
- **WHEN** the config defines a cloud profile for a remote provider or gateway-backed remote model
- **THEN** runtimes SHALL be able to resolve that profile as a first-class backend selection

### Requirement: Agent actions SHALL support model routing via the `actions` map
The system SHALL support mapping agent actions to model identifiers so different work categories use different models by default. The `actions` map (string key → model ID) is the first-class binding; `providerProfiles` + profile selection is the future extension.

**Implemented (ADR-0004, 2026-05-23):** Three-tier routing is now active in `.pi/providers.json`.

#### Scenario: Lightweight actions use the always-hot small model
- **WHEN** the policy registry maps `validation` to `Gemma-4-26B-A4B-it-GGUF`
- **THEN** the runtime SHALL select that model by default for the action

#### Scenario: Documentation upkeep uses the coding tier model
- **WHEN** the policy registry maps `docs-api`, `readme-upkeep`, `package-pages`, `structure-upkeep`, or `docs-upkeep` to `Qwen3-Coder-Next-GGUF`
- **THEN** the runtime SHALL select that model by default for those actions

#### Scenario: High-reasoning actions use the 122B model
- **WHEN** the policy registry maps `review`, `commit`, `changeset`, `release-readiness`, `ci-cd`, `docs-pipeline`, `repo-health`, or `test-audit` to `Qwen3.5-122B-A10B-GGUF-Q4_K_M`
- **THEN** the runtime SHALL select that model by default for those actions

#### Scenario: Refactoring or development prefers a cloud profile *(deferred — profile switching not yet wired)*
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

