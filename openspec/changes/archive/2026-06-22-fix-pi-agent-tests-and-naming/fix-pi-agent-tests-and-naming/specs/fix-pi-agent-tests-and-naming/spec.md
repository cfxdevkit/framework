## ADDED Requirements

### Requirement: pi-agent test output validation
The pi-agent test suite SHALL verify that the generated configuration output includes the `approvalMode` and `modelPolicies` fields with the expected values.

#### Scenario: Test output contains required fields
- **WHEN** `pi-agent:test` executes
- **THEN** the test output MUST include `"approvalMode": "defer"` and a `modelPolicies` object containing `"failureAnalysisModel": "explicit-model"` and `"messageGenerationModel": "explicit-model"`

### Requirement: Command file naming convention
All TypeScript files within the `pi-agent/src/commands` directory MUST adhere to kebab-case naming conventions to satisfy the `kebab-groups` validation.

#### Scenario: Kebab-case file validation
- **WHEN** `kebab-groups` scans the `pi-agent/src/commands` directory
- **THEN** all `.ts` files MUST be named using kebab-case and the validation MUST pass without warnings
