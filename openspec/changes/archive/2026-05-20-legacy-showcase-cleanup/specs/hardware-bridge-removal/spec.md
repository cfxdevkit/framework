## ADDED Requirements

### Requirement: Hardware bridge stub is removed from the workspace
The repository SHALL remove the placeholder `@cfxdevkit/hardware-bridge` package because hardware wallet support is provided directly by `@cfxdevkit/wallet`.

#### Scenario: Stub package deleted
- **WHEN** the cleanup change is applied
- **THEN** `repos/cfx-domain/packages/hardware-bridge/` SHALL no longer exist in the repository

#### Scenario: Workspace no longer references stub package
- **WHEN** workspace manifests are evaluated after the cleanup
- **THEN** no package-manager or task-runner config SHALL reference `@cfxdevkit/hardware-bridge`
