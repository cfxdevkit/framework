## ADDED Requirements

### Requirement: Cache invalidation for showcase-public check
The system SHALL invalidate or bypass stale cache entries before executing the `showcase-public:test` check to prevent cached check errors.

#### Scenario: Successful cache bypass
- **WHEN** the `showcase-public:test` check is triggered via `pnpm run check`
- **THEN** the system SHALL bypass or clear any stale cache associated with the check execution

### Requirement: Independent test execution
The system SHALL ensure the `showcase-public:test` check operates independently of the `pi-agent` test suite and its state.

#### Scenario: Isolation from pi-agent state
- **WHEN** the `pi-agent` test suite is running, failing, or reporting cached signals
- **THEN** the `showcase-public:test` check SHALL execute and report its own status without inheriting `pi-agent` errors or cache artifacts

### Requirement: Reliable check reporting
The system SHALL provide deterministic pass/fail outcomes for the `showcase-public:test` check upon execution.

#### Scenario: Deterministic check outcome
- **WHEN** a developer runs `pnpm run check` for the showcase-public capability
- **THEN** the system SHALL return a clear pass or fail status without cached error messages or ambiguous signals
