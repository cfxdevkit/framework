## ADDED Requirements

### Requirement: Commit workflow accepts progress callbacks
The `runCommitWorkflow` function SHALL accept an `onProgress` callback option that receives phase and detail strings. The function SHALL call this callback at each major step instead of writing directly to the terminal.

#### Scenario: Progress callback invoked at validation start
- **WHEN** `runCommitWorkflow` begins executing
- **THEN** `onProgress` is called with `phase: 'validation-start'`

#### Scenario: Progress callback invoked at scope detection
- **WHEN** `runCommitWorkflow` detects changed scopes
- **THEN** `onProgress` is called with `phase: 'scope-detection'` and `detail` listing scope labels

#### Scenario: Progress callback invoked at message generation
- **WHEN** `runCommitWorkflow` generates a commit message
- **THEN** `onProgress` is called with `phase: 'message-generation'`

#### Scenario: Progress callback invoked at post-checks
- **WHEN** `runCommitWorkflow` runs post-generation validation
- **THEN** `onProgress` is called with `phase: 'post-checks'`

#### Scenario: Progress callback invoked at commit
- **WHEN** `runCommitWorkflow` executes the git commit
- **THEN** `onProgress` is called with `phase: 'commit'`

### Requirement: Commit workflow accepts abort callback
The `runCommitWorkflow` function SHALL accept an `onAbort` callback option. If the workflow is aborted (via `ctx.signal` or explicit cancellation), it SHALL call `onAbort()` before returning.

#### Scenario: Abort callback invoked on user cancellation
- **WHEN** `ctx.signal` is aborted during workflow execution
- **THEN** `onAbort()` is called and the function returns `status: 'aborted'`

#### Scenario: Abort cleanup runs
- **WHEN** the workflow is aborted
- **THEN** any generated files (reports, changesets) are cleaned up

### Requirement: PI TUI progress reporter adapter
The `createPiProgressReporter` function SHALL produce an object with an `onProgress(phase, detail)` method that maps to PI TUI API calls: `ctx.ui.setWorkingMessage()`, `ctx.ui.setStatus()`, and `ctx.ui.setWidget()`.

#### Scenario: Working spinner shown during execution
- **WHEN** `onProgress` is called with a phase
- **THEN** `ctx.ui.setWorkingVisible(true)` is called with the phase message

#### Scenario: Footer status bar updated
- **WHEN** `onProgress` is called
- **THEN** `ctx.ui.setStatus()` is called with a summary string (e.g., `commit · blocked · shared-repo`)

#### Scenario: Detailed widget panel updated
- **WHEN** `onProgress` is called with a gate report
- **THEN** `ctx.ui.setWidget()` is called with the detailed gate status lines

### Requirement: No terminal cursor manipulation in TUI mode
When `PI_CODING_AGENT` environment variable is set to `true`, `runCommitWorkflow` SHALL NOT import or use `WorkflowTerminalUi`. It SHALL use the progress callback interface instead.

#### Scenario: TUI mode skips terminal UI import
- **WHEN** `process.env.PI_CODING_AGENT === 'true'`
- **THEN** `runCommitWorkflow` uses the `onProgress`/`onAbort` interface and does NOT call `moveCursor()`, `clearScreenDown()`, or `readline()`

#### Scenario: CLI mode uses terminal UI
- **WHEN** `process.env.PI_CODING_AGENT` is not set
- **THEN** `runCommitWorkflow` falls back to `WorkflowTerminalUi` for backward-compatible terminal output

## REMOVED Requirements

### Requirement: WorkflowTerminalUi is the sole UI path
**Reason**: Decoupled to enable PI TUI integration. `WorkflowTerminalUi` is retained for CLI backward compatibility but is no longer the only UI path.
**Migration**: New callers (PI tool/command) use `onProgress`/`onAbort` options. CLI callers continue to use `WorkflowTerminalUi`.
