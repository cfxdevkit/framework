## ADDED Requirements

### Requirement: pi-agent-test-snapshot-consistency
The pi-agent test suite SHALL maintain accurate snapshot expectations for configuration objects, specifically ensuring `approvalMode` defaults to `"defer"` and `modelPolicies` contains `failureAnalysisModel` and `messageGenerationModel` set to `"explicit-model"`.

#### Scenario: Successful snapshot validation
- **WHEN** pi-agent tests execute against the current configuration
- **THEN** the snapshot MUST include `"approvalMode": "defer"` and `"modelPolicies": { "failureAnalysisModel": "explicit-model", "messageGenerationModel": "explicit-model" }`

### Requirement: kebab-command-consolidation
The pi-agent command structure SHALL consolidate related repository commands into dedicated kebab-case files to improve maintainability and reduce fragmentation.

#### Scenario: Command file organization
- **WHEN** the pi-agent/src/commands directory is scanned
- **THEN** repository-related commands MUST be grouped into `repo-actions.ts`, `repo-check.ts`, `repo-commit.ts`, `repo-run.ts`, and `repo-status.ts` instead of multiple `repo*.ts` files.

### Requirement: check-validation-stability
The showcase-public:test validation step SHALL remain stable and not report cached signal errors when pi-agent test expectations are correctly aligned.

#### Scenario: Stable check execution
- **WHEN** showcase-public:test runs with updated pi-agent snapshots
- **THEN** the cached signal MUST resolve successfully without pointing to pi-agent:test diffs.
