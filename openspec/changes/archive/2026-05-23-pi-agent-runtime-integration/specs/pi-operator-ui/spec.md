## ADDED Requirements

### Requirement: Operator HUD data SHALL render through PI-native UI surfaces
The PI runtime SHALL render agent execution context and workflow state through PI-native UI surfaces instead of relying only on plain console output.

#### Scenario: Execution context appears in PI UI
- **WHEN** a maintainer starts a repo workflow in the PI runtime
- **THEN** the runtime SHALL show unit, provider, model, and mode context through PI status, footer, or widget UI

#### Scenario: Gate results appear in PI UI
- **WHEN** a workflow produces repository-policy or quality-gate results
- **THEN** the runtime SHALL render those results as structured PI output rather than flattening them into unstructured text only

### Requirement: Failure guidance SHALL be rendered as structured operator output
The system SHALL surface deterministic hints and LLM-backed failure analysis in a structured PI presentation that preserves severity and follow-up guidance.

#### Scenario: Failing gates show structured remediation guidance
- **WHEN** a workflow fails a gate and failure analysis is available
- **THEN** the PI runtime SHALL render the failure guidance as structured operator output with actionable next steps

#### Scenario: Deterministic-only failures still render useful guidance
- **WHEN** a workflow fails before any LLM-backed analysis is available
- **THEN** the PI runtime SHALL still render deterministic hints and failure state in structured operator UI

### Requirement: Long-running workflows SHALL update progress state in PI
The PI runtime SHALL keep operator-facing progress visible while long-running actions are executing.

#### Scenario: Active workflow updates status state
- **WHEN** a long-running repo workflow is executing in PI
- **THEN** the runtime SHALL update status or footer state so the operator can see the current phase without reading a full scrollback log

#### Scenario: Completed workflow clears or finalizes progress state
- **WHEN** the repo workflow completes successfully or with failure
- **THEN** the runtime SHALL finalize the progress state so the operator can distinguish active work from completed work