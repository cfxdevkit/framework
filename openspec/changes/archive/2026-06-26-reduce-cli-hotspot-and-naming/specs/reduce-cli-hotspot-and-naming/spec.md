## ADDED Requirements

### Requirement: CLI Keystore Complexity Reduction
The system SHALL refactor `repos/cfx-tools/packages/cli/src/commands/keystore.ts` to reduce its line count and cyclomatic complexity below the project-defined threshold of 590 lines.

#### Scenario: Successful complexity reduction
- **WHEN** the CLI keystore module is analyzed after refactoring
- **THEN** the file SHALL contain fewer than 590 lines and comply with the project's complexity scoring rules.

#### Scenario: Functional parity maintained
- **WHEN** the refactored keystore module is executed via CLI commands
- **THEN** all existing key management operations SHALL function identically to the pre-refactor state without regression.

### Requirement: Signer-Session Kebab-Case Naming Compliance
The system SHALL rename files in `repos/cfx-keys/packages/signer-session/src` that violate kebab-case naming conventions to align with the project's linting standards.

#### Scenario: File renaming compliance
- **WHEN** the signer-session source directory is scanned for naming violations
- **THEN** files matching `onekey*.ts` SHALL be renamed to `onekey-diagnostics.ts` and `onekey-session.ts` respectively.

#### Scenario: Import path updates
- **WHEN** the renamed files are integrated into the codebase
- **THEN** all internal and external import statements SHALL be updated to reference the new kebab-case filenames without breaking the build or lint pipeline.
