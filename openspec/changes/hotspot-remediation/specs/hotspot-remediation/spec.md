## ADDED Requirements

### Requirement: System shall split large hard hotspot files to reduce line counts and complexity scores below thresholds
The system SHALL automatically identify and split large, complex files that exceed hard hotspot thresholds (line count > 500 and/or complexity score > 1000) into smaller, focused modules while preserving all original functionality and test coverage.

#### Scenario: Split repo-namespace.ts
- **WHEN** the system detects `repo-namespace.ts` (632 lines, score 1444) as a hard hotspot
- **THEN** the system splits it into multiple modules (e.g., `repo-namespace.core.ts`, `repo-namespace.validation.ts`, `repo-namespace.utils.ts`) such that each resulting file has ≤ 300 lines and ≤ 800 complexity score

#### Scenario: Split agent-namespace.ts
- **WHEN** the system detects `agent-namespace.ts` (430 lines, score 1355) as a hard hotspot
- **THEN** the system splits it into focused modules (e.g., `agent-namespace.core.ts`, `agent-namespace.lifecycle.ts`) such that each resulting file has ≤ 300 lines and ≤ 800 complexity score

#### Scenario: Split repo-namespace.test.ts
- **WHEN** the system detects `repo-namespace.test.ts` (716 lines, score 1111) as a hard hotspot
- **THEN** the system splits it into test modules aligned with the source splits (e.g., `repo-namespace.core.test.ts`, `repo-namespace.validation.test.ts`) such that each resulting test file has ≤ 300 lines and ≤ 800 complexity score

#### Scenario: Split check.ts
- **WHEN** the system detects `check.ts` (991 lines, score 991) as a hard hotspot
- **THEN** the system splits it into modular check handlers (e.g., `check.hotspots.ts`, `check.kebab-groups.ts`, `check.lint.ts`) such that each resulting file has ≤ 300 lines and ≤ 800 complexity score

#### Scenario: Preserve functionality after splitting
- **WHEN** any file is split into new modules
- **THEN** all original exports, imports, and test assertions remain functionally equivalent; no behavior changes occur beyond structural refactoring

#### Scenario: Validate split results against thresholds
- **WHEN** splitting completes for all hard hotspot files
- **THEN** re-running `pnpm run cdk -- repo check hotspots -- --fail-on-hard` reports zero hard hotspots and zero errors for the four affected files
