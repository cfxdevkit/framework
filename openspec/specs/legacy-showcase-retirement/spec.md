# legacy-showcase-retirement Specification

## Purpose
TBD - created by archiving change legacy-showcase-cleanup. Update Purpose after archive.
## Requirements
### Requirement: Legacy example applications SHALL be retired from the active workspace
The system SHALL remove the legacy example applications `showcase`, `showcase-browser`, `showcase-stack`, `showcase-gateway`, `showcase-backend`, and `hardware-wallet-showcase` from the active workspace once their keeper replacements are ready.

#### Scenario: Workspace configuration no longer includes retired apps
- **WHEN** the workspace package graph is inspected after the retirement change lands
- **THEN** pnpm workspace configuration and Moon workspace configuration SHALL not list any of the retired example applications

#### Scenario: Retired app directories are absent
- **WHEN** the repository tree under `projects/examples/apps/` is inspected after the retirement change lands
- **THEN** the retired example application directories SHALL be absent from the active workspace

#### Scenario: Infrastructure and docs stop advertising retired apps
- **WHEN** release documentation or infrastructure routing configuration references example applications
- **THEN** only `showcase-local` and `showcase-public` SHALL be described as supported showcase surfaces

### Requirement: Hardware bridge stub SHALL be removed from the workspace
The system SHALL remove the placeholder `@cfxdevkit/hardware-bridge` package from the active workspace because supported hardware integrations live in `@cfxdevkit/wallet`.

#### Scenario: Stub package is no longer registered
- **WHEN** workspace package registration is inspected after the cleanup lands
- **THEN** `repos/cfx-domain/packages/hardware-bridge/` SHALL not be present and workspace configuration SHALL not reference `@cfxdevkit/hardware-bridge`

