## ADDED Requirements

### Requirement: Pi-agent test snapshot alignment
The pi-agent test suite SHALL validate the complete output structure, including the `approvalMode` field, and maintain synchronized snapshots to prevent test failures.

#### Scenario: Snapshot includes approvalMode field
- **WHEN** the pi-agent test suite executes via `pnpm run test`
- **THEN** the generated snapshot SHALL contain the `approvalMode` field set to `"defer"` and the test SHALL pass without snapshot mismatch errors.

### Requirement: Kebab-case naming for command files
All TypeScript files within the `pi-agent/src/commands` directory SHALL adhere to kebab-case naming conventions to satisfy repository linting standards.

#### Scenario: Command files renamed to kebab-case
- **WHEN** the `kebab-groups` validation runs against `pi-agent/src/commands`
- **THEN** files previously matching the `repo*.ts` pattern SHALL be renamed to `repo-actions.ts`, `repo-check.ts`, `repo-commit.ts`, `repo-run.ts`, and `repo-status.ts`, resulting in zero kebab-case warnings.
