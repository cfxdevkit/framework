## ADDED Requirements

### Requirement: Model Policies Approval Mode
The pi-agent system SHALL include an `approvalMode` field set to `defer` within its `modelPolicies` configuration to align with test expectations and runtime validation.

#### Scenario: Policy configuration validation
- **WHEN** the pi-agent loads its model policies configuration
- **THEN** the configuration MUST contain `"approvalMode": "defer"` alongside existing policy fields such as `failureAnalysisModel` and `messageGenerationModel`

### Requirement: Command File Naming Convention
All repository-related command files in the `pi-agent/src/commands` directory SHALL use kebab-case naming to satisfy structural validation checks.

#### Scenario: Structural check compliance
- **WHEN** the project's structural validation scans the `pi-agent/src/commands` directory
- **THEN** all repository command files MUST be renamed to kebab-case format (e.g., `repo-sync.ts`) and no camelCase or PascalCase variants SHALL remain
