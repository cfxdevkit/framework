## ADDED Requirements

### Requirement: CLI imports must be alphabetically sorted
The CLI module SHALL enforce strict alphabetical ordering of all import statements to maintain code consistency and satisfy ESLint configuration rules.

#### Scenario: Alphabetical sorting of command imports
- **WHEN** the CLI command file is analyzed for import ordering
- **THEN** all imported functions (e.g., addressFromFlags, chainFromFlags, deriveFromFlags, generateFromFlags, keystoreFromFlags, statusFromFlags, unitsFromFlags) are arranged in ascending alphabetical order.

### Requirement: Lint checks must pass without import sorting violations
The development pipeline SHALL ensure that the `devnode-server:lint` signal completes successfully without errors triggered by ESLint import sorting rules.

#### Scenario: Lint signal passes after sorting
- **WHEN** the `pnpm run lint` command is executed
- **THEN** the `devnode-server:lint` check reports zero errors and zero warnings related to import ordering.

### Requirement: Build checks must succeed without import-related failures
The wallet build process SHALL complete without errors or warnings caused by CLI import ordering discrepancies.

#### Scenario: Wallet build succeeds
- **WHEN** the `pnpm run check` command is executed
- **THEN** the `wallet:build` signal reports a successful build with no import-related failures.
