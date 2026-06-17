## ADDED Requirements

### Requirement: Correct type imports in pi-agent
The pi-agent codebase SHALL maintain accurate and complete type imports, ensuring that all referenced types such as `StatusReport` are properly declared and resolved without lint or compilation mismatches.

#### Scenario: StatusReport import resolution
- **WHEN** the linting pipeline analyzes pi-agent source files
- **THEN** the `StatusReport` type is correctly imported from its source module and resolves without import mismatch errors

### Requirement: Formatting compliance in pi-agent
The pi-agent codebase SHALL strictly adhere to the configured code formatting rules to eliminate formatting diffs during lint checks.

#### Scenario: Formatting diff elimination
- **WHEN** the pi-agent source files are processed by the formatting tool
- **THEN** no formatting mismatches or diffs are reported in the lint output

### Requirement: Assignment expression safety
The pi-agent codebase SHALL prevent assignments within expressions to comply with the `noAssignInExpressions` lint rule.

#### Scenario: Safe expression usage in wiki-validate
- **WHEN** the linting tool scans `src/wiki-validate.ts` and related pi-agent files
- **THEN** any assignments are refactored into standalone statements, eliminating `noAssignInExpressions` errors
