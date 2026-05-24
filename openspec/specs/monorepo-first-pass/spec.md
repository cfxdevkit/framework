# monorepo-first-pass Specification

## Purpose
First-pass monorepo consolidation: archive hygiene, moon registration gaps, canonical workspace-root utility, test support relocation.

## Requirements

### Requirement: Archived packages SHALL be marked private
`packages/archive/cdk-ai/package.json` and `infra/archive/llm-tools/package.json` SHALL have `"private": true`.

#### Scenario: Accidental publish prevented
- **WHEN** `pnpm publish` is run from the archive directory
- **THEN** pnpm SHALL refuse with "This package has been marked as private"

---

### Requirement: `docs-pipeline`, `docs-site`, `pi-agent` SHALL be registered in moon
All three SHALL appear in `.moon/workspace.yml`.

#### Scenario: pi-agent linted in gate
- **WHEN** `pnpm run lint` executes
- **THEN** `pi-agent:lint` SHALL appear in the task graph

#### Scenario: pi-agent:build is a dep of tooling-cli:build
- **WHEN** `moon task tooling-cli:build` is inspected
- **THEN** `pi-agent:build` SHALL appear in `Depends on`

---

### Requirement: `@cfxdevkit/workspace-utils` SHALL be the single `findWorkspaceRoot` implementation

`repos/cfx-config/packages/workspace-utils` SHALL export `findWorkspaceRoot(startDir?)` and `workspaceRoot`. All six previous duplicate implementations SHALL be removed and replaced with imports from this package.

#### Scenario: All consumers resolve to same root
- **WHEN** `findWorkspaceRoot()` is called from any cfx-tools package
- **THEN** it SHALL return `/workspaces/root` (or equivalent workspace root)

#### Scenario: arch-check, cdk-repo-check, docs-pipeline, tooling-cli, pi-agent compile
- **WHEN** `pnpm run typecheck` runs
- **THEN** all five packages SHALL typecheck without errors related to workspace-utils

---

### Requirement: `@cfxdevkit/testing` SHALL NOT export cfx-tools-internal sub-paths

`./tooling-cli-test-support` and `./llm-agents-test-support` sub-path exports SHALL be removed from `testing/package.json`. The moved files SHALL live in their consumer packages.

#### Scenario: tooling-cli tests use local test-support
- **WHEN** tooling-cli tests import `./test-support.js`
- **THEN** they SHALL find `tooling-cli/src/test-support.ts`

#### Scenario: @cfxdevkit/testing public API unchanged
- **WHEN** a consumer imports from `@cfxdevkit/testing`
- **THEN** `createMockClient`, `createDeferred`, `waitFor`, `DevNodeFixtureOptions` SHALL all resolve
