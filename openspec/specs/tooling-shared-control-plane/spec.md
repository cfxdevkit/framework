# tooling-shared-control-plane Specification

## Purpose
TBD - created by archiving change shared-backend-tooling-alignment. Update Purpose after archive.
## Requirements
### Requirement: Tooling consumers SHALL use the shared client-backed control plane
The system SHALL make `@cfxdevkit/devnode-server` the runtime owner for local tooling flows and SHALL require the VS Code extension and MCP server to consume that runtime through `@cfxdevkit/client`.

#### Scenario: VS Code extension uses shared client
- **WHEN** the extension performs supported runtime actions such as node control, network selection, keystore interaction, deploy, or contract operations
- **THEN** it SHALL issue those operations through `@cfxdevkit/client` against the shared `devnode-server` contract instead of owning a direct `@cfxdevkit/devnode` lifecycle path

#### Scenario: MCP server uses shared client
- **WHEN** the MCP server handles supported runtime tools such as node, account, deploy, or contract actions
- **THEN** it SHALL issue those operations through `@cfxdevkit/client` against the shared `devnode-server` contract instead of owning a direct `@cfxdevkit/devnode` lifecycle path

### Requirement: Shared tooling surface SHALL be validated end to end
The system SHALL expose and validate the backend and client surface required by the extension and MCP server.

#### Scenario: Required namespaces are available
- **WHEN** the typed client surface is inspected after the alignment change lands
- **THEN** it SHALL provide the node, network, keystore, deploy, and contract operations needed by the migrated tooling consumers

#### Scenario: Shared-path smoke coverage passes
- **WHEN** smoke coverage runs for the migrated tooling packages
- **THEN** it SHALL validate supported node, network, keystore, deploy, contract, and account flows through the shared client and backend path

