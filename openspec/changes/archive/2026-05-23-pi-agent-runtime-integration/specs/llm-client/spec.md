## ADDED Requirements

### Requirement: `llm-client` SHALL expose runtime-ready config resolution for embedded hosts
`llm-client` SHALL provide runtime-facing APIs that let embedded hosts resolve repo-default and unit-scoped configuration without duplicating config-loading logic.

#### Scenario: Embedded host resolves repo-default config
- **WHEN** an embedded runtime requests the repo-default LLM configuration
- **THEN** `llm-client` SHALL return the normalized repo-default runtime config

#### Scenario: Embedded host resolves scoped config
- **WHEN** an embedded runtime requests configuration for a selected monorepo unit
- **THEN** `llm-client` SHALL return the normalized scoped runtime config for that unit

### Requirement: `llm-client` SHALL expose provider and model bridge metadata for runtime registration
`llm-client` SHALL provide provider-selection and model-discovery data in a form that host runtimes can register directly.

#### Scenario: Host requests resolved provider bridge data
- **WHEN** a runtime asks for the active provider under the current strategy and scope
- **THEN** `llm-client` SHALL return provider metadata that identifies the selected provider path and its runtime-relevant defaults

#### Scenario: Host requests discovered models for the active provider
- **WHEN** a runtime asks for discovered models after resolving the active provider
- **THEN** `llm-client` SHALL return model metadata from the resolved provider without requiring the runtime to reimplement discovery rules