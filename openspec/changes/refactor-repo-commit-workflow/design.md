## Context

The commit workflow lives in `workers/commit/commit.ts` and is invoked from two entry points:
- **Command**: `/repo-commit` in `pi-customization/src/commands/repo-actions.ts`
- **Tool**: `repo_commit_workflow` in `pi-customization/src/tools.ts`

Both call through `tools/commit.ts` → `llm-agents-runtime.ts` → `runCommitWorkflow()`.

The current `runCommitWorkflow()` creates a `WorkflowTerminalUi` (from `workers/commit/terminal/ui.ts`) that directly manipulates the terminal: `moveCursor()`, `clearScreenDown()`, `readline()` prompts. This works for standalone CLI usage but completely breaks in the PI TUI, where:
- stdout is owned by the PI framework
- Terminal cursor manipulation produces garbled output
- `readline` input conflicts with the TUI's editor input

Additionally, the TUI confirm callback is stored in a global singleton `_tuiConfirmCb`, which can leak across sessions. Post-checks validation runs against the workspace and sees files created by the previous run (reports, changesets), causing false "unexpected changes" failures.

## Goals / Non-Goals

**Goals:**
- Make `runCommitWorkflow()` TUI-agnostic: replace terminal UI with progress callbacks
- Eliminate global `_tuiConfirmCb` singleton; scope confirm per-call
- Isolate file artifacts to `.pi/` directory so they don't pollute workspace validation
- Unify command and tool entry points to share one code path
- Add PI TUI progress reporting (spinner, status bar, widget panels)
- Support cancellation via `ctx.signal`

**Non-Goals:**
- Refactor the core gate execution logic (already done in gates/ split)
- Change the commit message generation algorithm
- Modify the `WorkflowTerminalUi` for backward-compatible CLI use — keep it as-is for non-TI callers
- Add new commit features (signing, gpg, etc.)

## Decisions

### Decision 1: Progress callbacks replace WorkflowTerminalUi

**Choice**: Add `onProgress(phase, detail)` and `onAbort()` callback options to `runCommitWorkflow()`. The function itself becomes pure — it does not import or depend on any UI module.

**Rationale**: This is the cleanest separation. The commit workflow is a business-logic function that returns a `PiCommitWorkflowResult`. UI rendering belongs to the caller (tool or command).

**Alternatives considered**:
- Keep `WorkflowTerminalUi` and add a "TUI mode" flag — this keeps terminal manipulation code in the codebase and adds more branching.
- Create a new `PiTerminalUi` that wraps the PI API — this duplicates the UI layer and creates a second terminal UI to maintain.

### Decision 2: Scoped confirm via options chain

**Choice**: Replace global `_tuiConfirmCb` with `tuiConfirm?: (question: string) => Promise<boolean>` passed as an option from tool → session → workflow.

**Rationale**: The confirm callback is inherently per-call (it's a user interaction for a specific workflow run). Scoping it as an option makes the data flow explicit and prevents leaks.

**Alternatives considered**:
- Use PI's `session_shutdown` event to clean up — this is a safety net but doesn't solve the architectural issue of having a global state.
- Pass confirm through the execution context — this mixes concerns (execution config vs. user interaction).

### Decision 3: Write artifacts to `.pi/artifacts/` not workspace `artifacts/`

**Choice**: Move `artifacts/llm/reports/llm-commit.md` to `.pi/artifacts/llm/reports/llm-commit.md`.

**Rationale**: The `.pi/` directory is already git-ignored and not scanned by validation. This eliminates the "unexpected changes" false positive without needing to change the validation logic.

**Alternatives considered**:
- Add generated files to the staged list before post-checks — this works but couples the workflow to git staging semantics.
- Modify `assertNoUnexpectedChanges` to ignore report files — this is a band-aid that doesn't solve the root cause.

### Decision 4: `createPiProgressReporter()` adapter

**Choice**: Create a lightweight adapter function that maps `onProgress` callbacks to PI TUI methods (`setWorkingMessage`, `setStatus`, `setWidget`). Keep `WorkflowTerminalUi` unchanged for CLI callers.

**Rationale**: The existing `WorkflowTerminalUi` is ~200 lines and handles the old CLI path. Creating a new adapter is cleaner than modifying the existing class, and keeps the two paths independent.

**Alternatives considered**:
- Make `WorkflowTerminalUi` accept a "mode" flag — this adds conditional rendering inside the UI class.
- Replace `WorkflowTerminalUi` entirely — this would break existing CLI usage.

## Risks / Trade-offs

| Risk | Likelihood | Mitigation |
|------|-----------|-----------|
| CLI users lose terminal UI feedback | Medium | Keep `WorkflowTerminalUi` as default for CLI; only use `onProgress` when `PI_CODING_AGENT=true` |
| `session_shutdown` not called before process exit | Low | Add cleanup in `finally` blocks at every layer |
| `.pi/` directory structure doesn't exist | Low | Create it lazily in the artifact writing function |
| LLM callers expect `WorkflowTerminalUi`-style output | Medium | Tool's `execute()` handles progress via `onUpdate`; LLM sees structured results, not terminal output |
| Breaking change to `runCommitWorkflow` signature | High | Update all callers: `commit.ts`, `precommit.ts`, `tools/commit.ts`, `tools.ts`, `commands/repo-actions.ts` |

## Migration Plan

### Phase 1: Adapter + option injection
1. Add `onProgress`, `onAbort` options to `runCommitWorkflow()` type
2. Create `createPiProgressReporter()` in `terminal/ui.ts`
3. Update `executePiCommitWorkflow` in `llm-agents-runtime.ts` to accept new options
4. Update `executePiCommitSession` in `tools/commit.ts` to pass options through

### Phase 2: Remove global singleton
1. Remove `_tuiConfirmCb` from `tools/commit.ts`
2. Pass `tuiConfirm` through the full chain
3. Ensure `finally` blocks clean up

### Phase 3: File artifact isolation
1. Update `writeCommitReport` to write to `.pi/artifacts/llm/reports/`
2. Update `writeChangesetFile` if it writes to workspace
3. Add generated files to staged list before post-checks

### Phase 4: TUI tool integration
1. Update `repo_commit_workflow` tool's `execute()` to use `onUpdate`, `ctx.ui`, `ctx.signal`
2. Update `/repo-commit` command to use same path as tool
3. Wire up `ctx.ui.setWorkingMessage()`, `ctx.ui.setStatus()`, `ctx.ui.setWidget()`

### Phase 5: Backward compatibility
1. Verify CLI usage still works (no `PI_CODING_AGENT` flag → uses `WorkflowTerminalUi`)
2. Run full validation suite
3. Test `/repo-commit` in PI TUI with success, failure, and abort scenarios
