## ADDED Requirements

### Requirement: `cdk agent commit` SHALL start a PI-backed interactive commit workflow
The system SHALL expose `cdk agent commit` as the interactive PI entrypoint for commit orchestration.

#### Scenario: Interactive commit boots in PI
- **WHEN** a maintainer runs `cdk agent commit`
- **THEN** the system SHALL start a PI-backed workflow session that shows commit progress and commit-specific operator UI

#### Scenario: Deterministic commit remains separate
- **WHEN** a maintainer runs `cdk repo commit`
- **THEN** the system SHALL keep the deterministic CLI workflow independent from the interactive PI workflow

### Requirement: Commit workflow failures SHALL remain recoverable inside the PI session
The system SHALL keep the operator inside the PI session when commit or precommit gates fail so issues can be reviewed and resolved without restarting the workflow from scratch.

#### Scenario: Blocking gate failure pauses in recoverable state
- **WHEN** repository-policy or quality gates fail during `cdk agent commit`
- **THEN** the workflow SHALL enter a recoverable failure state instead of terminating the process

#### Scenario: Operator can rerun failed checks after remediation
- **WHEN** the maintainer resolves a blocking issue inside the PI session
- **THEN** the workflow SHALL support rerunning the failed gate or workflow phase without starting a new session

### Requirement: Interactive commit SHALL render structured progress and issue state
The PI runtime SHALL render commit workflow phases, gate summaries, and remediation guidance as structured operator UI.

#### Scenario: Progress updates while commit phases execute
- **WHEN** the interactive commit workflow is running
- **THEN** the PI UI SHALL show the current workflow phase and progress state

#### Scenario: Failure guidance is visible in operator UI
- **WHEN** the workflow produces gate failures or failure-analysis guidance
- **THEN** the PI UI SHALL render the issue state and remediation guidance in structured operator output instead of plain terminal text only

### Requirement: Interactive commit SHALL require explicit approval before final commit execution
The system SHALL preserve an explicit approval boundary before staging/commit execution in the PI workflow.

#### Scenario: Approval is requested after checks and message preparation
- **WHEN** the interactive workflow reaches the final commit step
- **THEN** the PI runtime SHALL request explicit operator approval before creating the commit

#### Scenario: Declined approval preserves session state
- **WHEN** the maintainer declines final approval
- **THEN** the PI session SHALL remain active with the prepared workflow state available for further edits or reruns
