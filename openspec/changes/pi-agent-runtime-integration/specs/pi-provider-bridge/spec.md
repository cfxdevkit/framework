## ADDED Requirements

### Requirement: PI provider registration SHALL be derived from `llm-client` runtime resolution
The system SHALL use `llm-client` as the source of truth for provider selection, configuration loading, and model discovery when registering PI runtime providers.

#### Scenario: Repo-default config registers providers
- **WHEN** the PI runtime starts without a unit scope override
- **THEN** it SHALL register providers and defaults derived from the repo-level `llm-client` configuration

#### Scenario: Scoped config registers providers
- **WHEN** the PI runtime starts with `--scope <unit>`
- **THEN** it SHALL register providers and defaults using the selected unit overlay instead of the repo default

### Requirement: Provider strategy semantics SHALL be preserved in PI
The PI runtime SHALL preserve the existing `auto`, `gateway`, and `direct` provider-strategy semantics already defined by the shared LLM config.

#### Scenario: Gateway strategy prefers the shared gateway
- **WHEN** provider strategy resolves to `gateway`
- **THEN** the PI runtime SHALL prefer the configured gateway-compatible provider path for model selection and request execution

#### Scenario: Direct strategy bypasses the gateway
- **WHEN** provider strategy resolves to `direct`
- **THEN** the PI runtime SHALL register and select the direct provider path even if a gateway is also configured

### Requirement: PI runtime SHALL expose model selection and metadata from the resolved provider
The system SHALL surface discovered models from the resolved provider to PI so interactive and print flows can choose models without inventing a second discovery mechanism.

#### Scenario: PI runtime lists discovered models
- **WHEN** the resolved provider returns discovered models
- **THEN** the PI runtime SHALL expose those models for selection within the active session or request

#### Scenario: Explicit model override is honored
- **WHEN** a maintainer selects or passes an explicit model identifier supported by the resolved provider
- **THEN** the PI runtime SHALL execute the request with that model instead of silently falling back to a different default