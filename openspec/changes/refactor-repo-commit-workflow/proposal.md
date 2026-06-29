## Why

The `/repo-commit` command and `repo_commit_workflow` tool are broken in the PI TUI due to three interrelated issues: (1) terminal cursor manipulation in the commit workflow garbles the TUI output, (2) post-generation file artifacts (reports, changesets) cause validation to fail on re-runs, and (3) the global TUI-confirm singleton leaks across sessions. These problems prevent developers from reliably using the commit workflow inside the PI environment, forcing them to fall back to CLI-only usage or manual commits.

## What Changes

- **Decouple commit workflow from terminal UI** — Replace `WorkflowTerminalUi` (which calls `moveCursor()`, `clearScreenDown()`, `readline()`) with a progress-callback interface. The pure async `runCommitWorkflow` function accepts `onProgress`, `onConfirm`, and `onAbort` callbacks instead of requiring a terminal UI object.
- **Scoped TUI confirm** — Replace the global `_tuiConfirmCb` singleton in `tools/commit.ts` with per-call `tuiConfirm` option passed through the full chain: tool → session layer → runtime bridge → workflow. Add `session_shutdown` cleanup.
- **Fix file artifact pollution** — Write `llm-commit.md` report to `.pi/artifacts/llm/reports/` instead of `artifacts/llm/reports/`. Add generated files to the staged list *before* post-checks run. Ensure `assertNoUnexpectedChanges` only checks user-visible changes.
- **Unify command and tool entry points** — Both `/repo-commit` (command) and `repo_commit_workflow` (tool) use the same `executePiCommitWorkflow` path with identical parameter handling, confirmation flow, and return type.
- **PI TUI progress reporting** — Replace hardcoded `ui.startStep(1, 8)` with `ctx.ui.setWorkingMessage()` (spinner), `ctx.ui.setStatus()` (footer), and `ctx.ui.setWidget()` (detailed gate status).
- **Cancellation support** — Pass `ctx.signal` from the tool's `execute()` through to the workflow so the user can abort mid-flight. Clean up generated files on abort.

## Capabilities

### New Capabilities
- `repo-commit-tui-integration`: PI TUI-compatible progress reporting, confirmation dialogs, and cancellation for the commit workflow.
- `repo-commit-session-scoping`: Per-session TUI confirm lifecycle, no global singleton leaks.
- `repo-commit-artifact-management`: File artifact isolation to `.pi/` directory and pre-check staging so re-runs don't fail validation.

### Modified Capabilities
- `repo-commit-workflow`: **BREAKING** — `runCommitWorkflow` signature changes from `runCommitWorkflow(args, options: { approvalMode, modelPolicies, tuiConfirm, stdout, stderr })` to `runCommitWorkflow(args, options: { approvalMode, modelPolicies, tuiConfirm, onProgress, onAbort, stdout, stderr })`. Terminal UI integration removed.

## Impact

**Files modified:**
- `workers/commit/commit.ts` — Core workflow: remove `WorkflowTerminalUi`, add `onProgress`/`onAbort` callbacks, fix file staging before post-checks
- `workers/commit/terminal/ui.ts` — Keep for backward compat CLI, mark as deprecated for PI path
- `workers/commit/terminal/ui.ts` — Add `createPiProgressReporter()` adapter
- `tools/commit.ts` — Remove global `_tuiConfirmCb`, pass `tuiConfirm` as option
- `tools.ts` — `repo_commit_workflow` tool: use `onUpdate`, `ctx.ui`, `ctx.signal`
- `commands/repo-actions.ts` — `/repo-commit` command: delegate to same path as tool
- `llm-agents-runtime.ts` — Add `onProgress`/`onAbort` to `PiCommitWorkflowResult` return type
- `pi-customization/src/ui.ts` — Add `createPiCommitProgressUiState()` for live progress widgets

**Dependencies:**
- `@cfxdevkit/llm-agents` — `runCommitWorkflow` function signature change
- `@earendil-works/pi-coding-agent` — TUI API usage (widget, status, working indicator)
