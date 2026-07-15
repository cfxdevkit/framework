## ADDED Requirements

### Requirement: Keystore Module Refactoring
The system SHALL refactor `keystore.ts` to extract sub-commands and utility functions into dedicated modules, ensuring the primary file line count falls below the hard hotspot threshold.

#### Scenario: Extract sub-commands and utilities
- **WHEN** the `keystore.ts` file is analyzed for complexity
- **THEN** its line count is reduced below the hard hotspot limit by delegating logic to extracted modules

### Requirement: Kebab-case File Naming
The system SHALL rename all `onekey*.ts` files in the `signer-session/src` directory to strictly follow kebab-case naming conventions and update all corresponding import statements.

#### Scenario: Rename onekey files to kebab-case
- **WHEN** the repository naming convention check is executed
- **THEN** `onekey-diagnostics.ts` and `onekey-session.ts` are correctly named and all internal/external imports are updated to match
