## ADDED Requirements

### Requirement: TUI confirm is scoped per-call
The `setTuiConfirm` function SHALL be replaced by a `tuiConfirm` option that is passed through the full call chain: `repo_commit_workflow` tool → `executePiCommitSession` → `executePiCommitWorkflow` → `runCommitWorkflow`.

#### Scenario: Confirm callback passed from tool
- **WHEN** the `repo_commit_workflow` tool is executed
- **THEN** `tuiConfirm` is set to a wrapper around `ctx.ui.confirm()` and passed through the full chain

#### Scenario: Confirm callback passed from command
- **WHEN** the `/repo-commit` command is invoked
- **THEN** `tuiConfirm` is set to a wrapper around `ctx.ui.confirm()` and passed through the full chain

### Requirement: No global TUI confirm singleton
The `tools/commit.ts` module SHALL NOT export a global `setTuiConfirm` function. The `_tuiConfirmCb` module-level variable SHALL be removed.

#### Scenario: No global state in commit module
- **WHEN** `tools/commit.ts` is loaded
- **THEN** no module-level mutable variables exist for TUI confirm state

#### Scenario: Confirm cleanup on workflow completion
- **WHEN** the workflow finishes (success, failure, or abort)
- **THEN** the confirm callback is NOT reused by subsequent tool calls

### Requirement: Session-scoped confirm lifecycle
The TUI confirm callback SHALL be scoped to the lifecycle of a single `runCommitWorkflow` invocation. It SHALL NOT persist beyond the `finally` block of the tool's `execute()` method.

#### Scenario: Confirm cleared on error
- **WHEN** `runCommitWorkflow` throws an error
- **THEN** the `finally` block in `execute()` still clears the TUI confirm

#### Scenario: Confirm cleared on abort
- **WHEN** the workflow is aborted via `ctx.signal`
- **THEN** the `finally` block still clears the TUI confirm

### Requirement: Command and tool use identical confirmation path
Both the `/repo-commit` command and the `repo_commit_workflow` tool SHALL pass `tuiMode: true`, `singlePassApproval: true`, and the same `tuiConfirm` wrapper to `executePiCommitSession`.

#### Scenario: Command confirmation path matches tool
- **WHEN** `/repo-commit` is invoked
- **THEN** it calls `executePiCommitSession({ tuiMode: true, singlePassApproval: true, tuiConfirm })`

#### Scenario: Tool confirmation path matches command
- **WHEN** `repo_commit_workflow` tool is called
- **THEN** it calls `executePiCommitSession({ tuiMode: ctx.hasUI, singlePassApproval: ctx.hasUI, tuiConfirm })`

## REMOVED Requirements

### Requirement: Global setTuiConfirm singleton
**Reason**: Per-call scoping is safer and prevents state leaks across sessions.
**Migration**: All callers pass `tuiConfirm` as an option instead of calling `setTuiConfirm()`.
