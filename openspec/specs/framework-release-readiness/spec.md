# framework-release-readiness Specification

## Purpose
Defines the conditions that must be satisfied before the `v2.0.0` tag can be applied to the framework monorepo. Covers documentation accuracy, workspace configuration hygiene, OpenSpec change lifecycle, and root quality gates.

## Requirements

### Requirement: Release documentation SHALL describe the supported keeper surface
The system SHALL update release-facing documentation so it describes only the supported keeper showcase apps and the actual package state of the repository.

#### Scenario: Root docs describe keeper apps only
- **WHEN** a user reads the root README or architecture documentation for the release candidate
- **THEN** those docs SHALL describe only `showcase-local` and `showcase-public` as the supported showcase applications

#### Scenario: Stale package references removed from docs
- **WHEN** architecture or structure docs describe packages in the release candidate
- **THEN** deleted legacy showcase apps and the removed `@cfxdevkit/hardware-bridge` stub SHALL not be documented as active parts of the workspace

### Requirement: Workspace SHALL carry a v2.0.0 changelog entry
The CHANGELOG.md at the workspace root SHALL contain a `v2.0.0` entry documenting the stabilised Tier 0 and Tier 1 packages and the release-state showcase applications.

#### Scenario: CHANGELOG entry exists
- **WHEN** a reader opens `/workspaces/root/CHANGELOG.md`
- **THEN** it SHALL contain a `## [2.0.0]` heading with at least one entry per stabilised Tier 0 package and a summary of the two keeper showcase apps

#### Scenario: No legacy apps mentioned in changelog
- **WHEN** the CHANGELOG entry for v2.0.0 is read
- **THEN** it SHALL NOT reference deleted legacy showcase apps as active components

### Requirement: Release candidate SHALL satisfy workspace cleanup and quality gates
The system SHALL not be considered release-ready for `v2.0.0` until all planned OpenSpec changes are archived and the full root quality gates pass.

#### Scenario: All planned changes archived
- **WHEN** `openspec list` is run
- **THEN** `showcase-local-refactor`, `showcase-public-completion`, `shared-backend-tooling-alignment`, `cas-frontend-cleanup`, `legacy-showcase-cleanup`, and `release-prep-v0-1-0` SHALL all appear in the `archive/` directory

#### Scenario: Workspace configuration reflects cleanup
- **WHEN** workspace manifests and task-runner metadata are inspected for the release candidate
- **THEN** they SHALL not reference deleted showcase apps or removed stub packages

#### Scenario: Full root quality gates pass
- **WHEN** the release quality suite is run from the workspace root
- **THEN** `pnpm -w typecheck`, `pnpm -w lint`, `pnpm -w test`, and `pnpm check:unused` SHALL complete successfully

### Requirement: CAS release artifacts SHALL not remain stale
The system SHALL archive or clearly deprecate stale CAS OpenSpec change artifacts before the release tag is created.

#### Scenario: CAS spec artifacts reviewed
- **WHEN** the CAS OpenSpec change directories are reviewed during release prep
- **THEN** outdated change cycles SHALL either be moved to archive or marked with a clear deprecation notice

#### Scenario: Stray CAS project change markers are archived
- **WHEN** `projects/cas/openspec/changes/` contains old change-cycle markers such as `examples-shared-foundation`
- **THEN** those markers SHALL live under `projects/cas/openspec/changes/archive/` instead of the active changes directory

