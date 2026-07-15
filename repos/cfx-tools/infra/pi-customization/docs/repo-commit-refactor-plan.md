# /repo-commit Refactor Plan

## Research Findings

### How pi-coding-agent actions/workflows should work

Based on the pi-coding-agent SDK documentation and community extensions (better-workflows, pi-dynamic-workflows), the correct patterns are:

1. **Tools (callable by LLM)** — Long-running operations use:
   - `tool_execution_update` events for progress streaming
   - `ctx.signal` for cancellation awareness
   - Persisted state files for resumable runs
   - Widget/status updates via `ctx.ui.setStatus()` and `ctx.ui.setWidget()`

2. **Commands (callable by user)** — Direct TUI operations use:
   - `ctx.ui.confirm()`, `ctx.ui.select()` for interactive prompts
   - `ctx.ui.setStatus()` for footer status
   - `ctx.ui.setWidget()` for inline progress panels
   - `ctx.ui.setWorkingVisible(true)` + `ctx.ui.setWorkingMessage()` for spinner

3. **No terminal cursor manipulation** — The old CLI pattern of `moveCursor()`, `clearScreenDown()` etc. does NOT work in the PI TUI. Replace with widget-based UI.

### Best practices from community extensions

- **better-workflows** (npm:@anishthite/pi-better-workflows): Registers a single `workflow` tool that runs scripts with subagents. Uses `tool_execution_update` for live progress, persists journals to `~/.pi/`, and returns structured results.

- **pi-dynamic-workflows**: Script-based workflow that fans out work across isolated subagents. Shows live progress via snapshots.

- **Key pattern**: Tool → runs async work → calls `onUpdate` for progress → returns structured result. No terminal manipulation.

---

## Current Issues

### 1. Terminal UI conflicts with PI TUI

**File**: `workers/commit/terminal/ui.ts`

The commit workflow creates a `WorkflowTerminalUi` that:
- Calls `process.stdout.moveCursor()`, `process.stdout.clearScreenDown()`
- Uses `readline` for interactive input
- Directly manipulates the terminal

**Problem**: This conflicts with the PI TUI's widget-based UI. In TUI mode, the terminal is controlled by the PI framework, not the extension.

**Impact**: When `/repo-commit` runs from PI, the terminal cursor manipulation produces garbled output and the readline input breaks the TUI.

### 2. Post-checks fail on re-runs (file artifacts)

**File**: `workers/commit/commit.ts` (post-checks section)

After a successful commit:
1. `artifacts/llm/reports/llm-commit.md` is written
2. Changeset files may be created
3. Files are staged and committed

On the **second run** of `/repo-commit`:
1. Precheck validation runs
2. Detects new/modified files in the working tree
3. The `assertNoUnexpectedChanges()` call may fail because artifact files were created

**Root cause**: The commit workflow creates files that the validation step considers "unexpected". The post-checks step runs validation AFTER generating the commit message and changeset, so it sees files it didn't create itself.

### 3. TUI confirmation is not properly integrated

**File**: `tools/commit.ts`

The `setTuiConfirm` pattern:
```typescript
let _tuiConfirmCb: ((question: string) => Promise<boolean>) | null = null;
export function setTuiConfirm(cb): void { _tuiConfirmCb = cb; }
```

This is a global singleton that:
- Can leak across sessions if the `finally` block doesn't run
- Has no session-scoped cleanup via `session_shutdown`
- Creates a race condition if two workflows run concurrently

**Problem**: After `/repo-commit` runs (success or failure), if the `finally` block throws or is skipped, the TUI confirm callback persists and affects subsequent tool calls.

### 4. Command and tool logic divergence

**Command** (`/repo-commit` in `repo-actions.ts`):
```typescript
approvalMode: 'prompt',  // asks for approval
tuiMode: true,
singlePassApproval: true,
```

**Tool** (`repo_commit_workflow` in `tools.ts`):
```typescript
tuiMode: ctx.hasUI,
singlePassApproval: ctx.hasUI,
```

**Problem**: The command and tool call different code paths. The command uses `executePiCommitSession` from `tools/commit.ts`, which has complex logic for `singlePassApproval`. The tool does the same but with different defaults. When the tool is called by the LLM, it may behave differently than when the user runs `/repo-commit`.

### 5. No use of PI event system

The commit workflow doesn't use PI's event system:
- No `tool_execution_update` events for progress streaming
- No `tool_execution_end` for final result notification
- No `ctx.signal` for cancellation support
- No widget updates during gate execution

### 6. Progress reporting is hardcoded

The workflow has internal step numbering (`ui.startStep(1, 8, '...')`) that:
- Only works when `WorkflowTerminalUi` is used
- Produces no output in PI TUI mode (the TUI mode still uses `WorkflowTerminalUi` which tries to write to stdout)
- Should instead use `ctx.ui.setWorkingMessage()` and `ctx.ui.setStatus()`

---

## Proposed Architecture

### Single source of truth: `executePiCommitWorkflow`

All entry points (command + tool) should go through `executePiCommitWorkflow` in `llm-agents-runtime.ts`. The commit workflow in `workers/commit/commit.ts` should be decoupled from terminal UI.

### Layered separation

```
┌─────────────────────────────────────────────┐
│  PI Extension (extension.ts)                │
│  - Registers commands & tools               │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│  Commands (repo-actions.ts)                 │
│  - /repo-actions                            │
│  - /repo-check                              │
│  - /repo-commit  ← sets up TUI, calls tool  │
│  - /repo-run                                │
│  - /repo-status                             │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│  Tools (tools.ts)                           │
│  - repo_agent_check                         │
│  - repo_action_catalog                      │
│  - repo_run_action                          │
│  - repo_commit_workflow ← calls session     │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│  Session Layer (tools/commit.ts)            │
│  - executePiCommitSession                   │
│  - setTuiConfirm (scoped, not global)       │
│  - resolveCommitRuntimePolicy               │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│  Runtime Bridge (llm-agents-runtime.ts)     │
│  - executePiCommitWorkflow                  │
│  - ensureModule()                           │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│  Commit Workflow (workers/commit/commit.ts) │
│  - runCommitWorkflow(args, options)         │
│  - NO terminal UI, NO readline              │
│  - NO process.exitCode manipulation         │
│  - Pure async function + result object      │
└─────────────────────────────────────────────┘
```

### Key changes

#### 1. Remove terminal UI from commit workflow

Replace `createWorkflowTerminalUi` with a PI TUI-compatible progress reporter:

```typescript
// Before (in commit.ts):
const ui = createWorkflowTerminalUi({
  commandLabel: 'repo commit',
  executionContext,
  workingSet: summarizeWorkingSet(scopes),
  llmFailureAnalysis: executionContext.llm.status === 'ready',
});
ui.start();

// After: Accept a progress callback instead
const progress = (phase: string, detail?: string) => {
  onProgress?.({ phase, detail, status: statusForPhase(phase) });
};
const result = await runCommitWorkflow(args, {
  modelPolicies,
  approvalMode,
  onProgress,
  onConfirm,
});
```

#### 2. Scoped TUI confirm

Replace the global `_tuiConfirmCb` with per-session scoping:

```typescript
// Before: Global singleton
let _tuiConfirmCb: ((q: string) => Promise<boolean>) | null = null;
export function setTuiConfirm(cb) { _tuiConfirmCb = cb; }

// After: Passed through the options chain
interface CommitWorkflowOptions {
  tuiConfirm?: ((question: string) => Promise<boolean>) | null;
}
```

#### 3. File artifact management

The commit workflow should:
- Track all generated files in a list
- Only stage files that are part of the commit
- NOT run post-checks against untracked files
- Clean up or ignore artifact files in validation

Specifically, `artifacts/llm/reports/llm-commit.md` should either:
- Be written to a `.pi/` directory (ignored by validation), or
- Be added to the staged files before post-checks run

#### 4. Unified command + tool

Both `/repo-commit` command and `repo_commit_workflow` tool should:
- Accept the same parameters
- Pass the same options through
- Return the same result type
- Use the same confirmation path

The command should just set `tuiMode: true` and the tool should set `tuiMode: ctx.hasUI`, then both go through the same `executePiCommitWorkflow` path.

#### 5. Progress reporting via PI events

The tool's `execute` function should use:
- `onUpdate?.({ content: [{ type: 'text', text: phase }] })` for progress
- `ctx.ui.setWorkingMessage(phase)` for spinner
- `ctx.ui.setStatus()` for footer status
- `ctx.ui.setWidget()` for detailed progress

#### 6. Cancellation support

The tool's `execute` function receives `signal` and `ctx.signal`. Pass this to the workflow so it can be aborted mid-flight.

---

## Implementation Plan

### Phase 1: Decouple commit workflow from terminal UI

**File**: `workers/commit/commit.ts`

1. Add `onProgress?: (phase: string, detail?: string) => void` to options
2. Replace `WorkflowTerminalUi` calls with progress callbacks
3. Remove terminal cursor manipulation code path
4. Keep `WorkflowTerminalUi` for non-TI standalone CLI use (backward compat)

### Phase 2: Fix TUI confirm scoping

**File**: `tools/commit.ts`

1. Remove global `_tuiConfirmCb`
2. Pass `tuiConfirm` through the full chain: tool → session → workflow
3. Ensure cleanup in `finally` blocks at every level

### Phase 3: Fix file artifact pollution

**Files**: `workers/commit/commit.ts`, `workers/commit/message.ts`

1. Write `artifacts/llm/reports/llm-commit.md` to `.pi/artifacts/llm/reports/` instead
2. Add `.pi/` to the list of ignored paths in validation
3. OR: Add generated files to staged list BEFORE post-checks

### Phase 4: Unify command and tool logic

**File**: `commands/repo-actions.ts`, `tools.ts`

1. Make `/repo-commit` command delegate to the same flow as the tool
2. Standardize parameter handling: `prompt`, `quick`, `model`
3. Ensure same confirmation path in both

### Phase 5: Add proper progress reporting

**File**: `tools.ts` (tool execute function)

1. Use `onUpdate` for progress streaming
2. Use `ctx.ui.setWorkingMessage()` for spinner
3. Use `ctx.ui.setStatus()` for footer
4. Use `ctx.ui.setWidget()` for detailed progress (via existing UI state factories)

### Phase 6: Add cancellation support

**File**: `tools.ts` (tool execute function)

1. Pass `ctx.signal` to the workflow
2. Handle `AbortError` gracefully
3. Clean up any created files on abort

---

## Risk Assessment

| Risk | Mitigation |
|------|-----------|
| Breaking standalone CLI usage | Keep `WorkflowTerminalUi` as fallback for non-TI path |
| Existing sessions depend on global `setTuiConfirm` | Replace atomically — the global is only set inside `finally` blocks |
| File artifact cleanup on abort | Track generated files in a list, clean up in `finally` |
| LLM callers expect specific tool behavior | Keep return type identical, only change internal implementation |

---

## Success Criteria

1. `/repo-commit` runs cleanly in PI TUI without garbled terminal output
2. Re-running `/repo-commit` doesn't fail due to leftover artifact files
3. `setTuiConfirm` cleanup works reliably even on errors
4. `/repo-commit` command and `repo_commit_workflow` tool behave identically
5. Progress is visible in the TUI (spinner + widget + status bar)
6. Workflow can be cancelled mid-flight without leaving artifacts
