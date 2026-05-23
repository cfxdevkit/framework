# repo-check-lint-fix Specification

## Purpose
TBD - created by archiving change repo-check-lint-fix. Update Purpose after archive.
## Requirements
### Requirement: repo-check CLI must produce valid JSON output in format step
The system SHALL ensure that the `repo check docs --json` command outputs syntactically valid JSON without malformed minus-digit sequences.

#### Scenario: JSON output is valid after format step
- **WHEN** user runs `pnpm run format`
- **THEN** subsequent execution of `pnpm run tooling -- -- repo check docs --json` produces valid JSON with no parse errors

### Requirement: repo-check CLI must export all required functions and types
The system SHALL ensure that all imported functions and types used in `commands.js`, `context.js`, and `types` are properly exported from their respective modules.

#### Scenario: All required exports are present
- **WHEN** user runs `pnpm run lint`
- **THEN** no lint errors occur for missing exports in `commands.js`, `context.js`, or `types`

### Requirement: repo-check CLI must pass lint checks before check step executes
The system SHALL ensure that lint errors do not propagate to the check step, and that the check step only runs when linting passes.

#### Scenario: Check step succeeds after lint fix
- **WHEN** user runs `pnpm run check`
- **THEN** check step completes successfully with no lint-related errors, provided linting has been fixed

### Requirement: repo-check CLI must support structured output for downstream parsing
The system SHALL ensure that structured output (e.g., `--json`) is correctly formatted and consumable by external tools.

#### Scenario: Structured output is parseable
- **WHEN** user runs `pnpm run tooling -- -- repo check docs --json`
- **THEN** output is valid JSON and can be parsed by standard JSON parsers without errors

