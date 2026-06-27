## ADDED Requirements

### Requirement: showcase-public test isolation and reliability
The system SHALL ensure the `showcase-public:test` suite executes independently without coupling to other test suites or cached state errors.

#### Scenario: Independent test execution
- **WHEN** the `showcase-public:test` command is invoked
- **THEN** the test suite SHALL run to completion without failing due to cached artifacts or external coupling

#### Scenario: Cache error resolution
- **WHEN** a cached test error occurs during execution
- **THEN** the system SHALL invalidate the cache and re-run the affected tests until they pass

#### Scenario: Decoupling from pi-agent changes
- **WHEN** `pi-agent` changes are introduced
- **THEN** the `showcase-public:test` suite SHALL remain unaffected and continue to pass independently
