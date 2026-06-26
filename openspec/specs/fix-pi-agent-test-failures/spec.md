# fix-pi-agent-test-failures Specification

## Purpose
TBD - created by archiving change fix-pi-agent-test-failures. Update Purpose after archive.
## Requirements
### Requirement: Model Policies Approval Mode
The system SHALL include the `approvalMode` field within the `modelPolicies` object in the output, with the value set to `defer`.

#### Scenario: Model policies output contains approval mode defer
- **WHEN** the system returns model policies configuration
- **THEN** the output MUST contain `modelPolicies.approvalMode` equal to `defer`

#### Scenario: Model policies structure validation
- **WHEN** validating the model policies structure
- **THEN** the `approvalMode` field MUST be present and set to `defer`

