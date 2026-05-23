### Requirement: Identify and enforce hard hotspot thresholds
The system SHALL scan source files and identify hard hotspots based on configurable thresholds (e.g., line count ≥ 400 and/or complexity score ≥ 1000), and fail validation when any hard hotspot is detected.

#### Scenario: Hard hotspot detection triggers failure
- **WHEN** the `repo check hotspots` command is executed with `--fail-on-hard` enabled
- **THEN** the system reports an error status and lists all hard hotspots exceeding thresholds, including file path, line count, and complexity score

### Requirement: Enforce modularity by splitting hard hotspots
The system SHALL require that any identified hard hotspot file be refactored into smaller, focused modules such that no single file exceeds the hard hotspot thresholds.

#### Scenario: Refactored file passes hotspot check
- **WHEN** a previously hard-hotspot file (e.g., `repo-namespace.ts`) is split into multiple modules (e.g., `repo-namespace/core.ts`, `repo-namespace/queries.ts`, `repo-namespace/mutations.ts`)
- **THEN** each resulting module has line count < 400 and complexity score < 1000, and the `repo check hotspots` command passes without hard errors

### Requirement: Validate hotspot thresholds across all file types
The system SHALL apply hotspot thresholds consistently across TypeScript source files (`.ts`, `.tsx`), test files (`.test.ts`, `.spec.ts`), and other source-like files (e.g., `.css`), while allowing differentiated thresholds per file type if explicitly configured.

#### Scenario: Test file hotspot is detected and flagged
- **WHEN** a test file (e.g., `repo-namespace.test.ts`) exceeds the hard hotspot line count (e.g., ≥ 400 lines) or complexity score (e.g., ≥ 1000)
- **THEN** the system flags it as a hard hotspot and requires refactoring (e.g., splitting into multiple test modules or reducing test scope per file)

### Requirement: Provide actionable remediation guidance
The system SHALL provide clear, file-specific guidance for refactoring hard hotspots, including suggested module boundaries and recommended file naming conventions.

#### Scenario: Remediation guidance is included in hotspot report
- **WHEN** a hard hotspot is detected (e.g., `check.ts` with 991 lines)
- **THEN** the report includes suggestions such as: “Split into `check/validator.ts`, `check/executor.ts`, and `check/reporter.ts`” and references OpenSpec modularity guidelines

### Requirement: Prevent reintroduction of hard hotspots
The system SHALL enforce hotspot thresholds as part of CI/CD pipelines and block merges or deployments when new hard hotspots are introduced.

#### Scenario: CI blocks merge due to new hotspot
- **WHEN** a pull request introduces a new file exceeding hard hotspot thresholds (e.g., a new 450-line service file)
- **THEN** the CI pipeline fails the build step and prevents merging until the file is refactored or an exception is approved
