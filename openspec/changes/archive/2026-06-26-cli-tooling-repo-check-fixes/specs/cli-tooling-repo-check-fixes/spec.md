## ADDED Requirements

### Requirement: tooling-cli-lint-validation
The system SHALL enforce organized imports and exports using Biome during the lint phase to prevent unorganized import errors.

#### Scenario: Successful lint pass
- **WHEN** `pnpm run lint` is executed in the `tooling-cli` package
- **THEN** the command SHALL pass without errors regarding unorganized imports, and all imports SHALL be automatically organized by Biome.

### Requirement: cli-typecheck-validation
The system SHALL ensure all TypeScript files compile without unused variable errors during the typecheck phase.

#### Scenario: Unused variable removal
- **WHEN** `pnpm run typecheck` is executed in the `cli` package
- **THEN** the compiler SHALL report zero TS6133 errors, specifically ensuring that declared variables like `iFK` are either actively used or removed from `src/commands/keystore.ts`.

### Requirement: llm-agents-build-validation
The system SHALL guarantee that all imported modules are properly exported from their source files during the build phase.

#### Scenario: Missing export resolution
- **WHEN** `pnpm run build` is executed in the `llm-agents` package
- **THEN** the build SHALL succeed without `MISSING_EXPORT` errors, specifically ensuring that `repoCheckCommand` is correctly exported from `workers/agents/check/types.ts`.

### Requirement: codebase-hotspot-refactoring
The system SHALL track file complexity and enforce incremental refactoring for hard hotspots that exceed the defined line count threshold.

#### Scenario: Hard hotspot detection and remediation
- **WHEN** `pnpm run cdk -- repo check hotspots -- --fail-on-hard` is executed
- **THEN** the system SHALL flag files exceeding the complexity threshold (e.g., 590 lines in `keystore.ts`) and require incremental refactoring to reduce the line count and complexity score below the hard limit.
