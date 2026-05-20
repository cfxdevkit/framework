## ADDED Requirements

### Requirement: Workspace SHALL carry a v0.1.0 changelog entry
The CHANGELOG.md at the workspace root SHALL contain a `v0.1.0` entry documenting the stabilised Tier 0 and Tier 1 packages and the release-state showcase applications.

#### Scenario: CHANGELOG entry exists
- **WHEN** a reader opens `/workspaces/root/CHANGELOG.md`
- **THEN** it SHALL contain a `## [0.1.0]` heading with at least one entry per stabilised Tier 0 package and a summary of the two keeper showcase apps

#### Scenario: No legacy apps mentioned in changelog
- **WHEN** the CHANGELOG entry for v0.1.0 is read
- **THEN** it SHALL NOT reference deleted legacy showcase apps as active components

### Requirement: Architecture docs SHALL not reference removed packages or apps
Static architecture documentation SHALL be free of references to `@cfxdevkit/hardware-bridge` and deleted legacy showcase applications as active components.

#### Scenario: hardware-bridge removed from ARCHITECTURE.md
- **WHEN** `ARCHITECTURE.md` is read
- **THEN** `@cfxdevkit/hardware-bridge` SHALL NOT appear as a live package in the Tier table

#### Scenario: Legacy apps not listed in ARCHITECTURE.md
- **WHEN** `ARCHITECTURE.md` is read
- **THEN** it SHALL NOT list `showcase`, `showcase-browser`, `showcase-stack`, `showcase-gateway`, or `showcase-backend` as active applications

#### Scenario: docs/STRUCTURE.md reflects current app set
- **WHEN** `docs/STRUCTURE.md` is read
- **THEN** it SHALL describe only `showcase-local` and `showcase-public` as the keeper example applications

## MODIFIED Requirements

### Requirement: Release candidate SHALL satisfy workspace cleanup and quality gates
The system SHALL not be considered release-ready for `v0.1.0` until all five planned OpenSpec changes are archived and the full root quality gates pass.

#### Scenario: All planned changes archived
- **WHEN** `openspec list` is run
- **THEN** `showcase-local-refactor`, `showcase-public-completion`, `shared-backend-tooling-alignment`, `cas-frontend-cleanup`, and `legacy-showcase-cleanup` SHALL all appear in the `archive/` directory, not in the active changes list

#### Scenario: Full root quality gates pass
- **WHEN** the release quality suite is run from the workspace root
- **THEN** `pnpm -w typecheck`, `pnpm -w lint`, `pnpm -w test`, and `pnpm check:unused` SHALL complete successfully
