## 1. Core workflow signature change

- [x] 1.1 Add `onProgress`, `onAbort` options to `CommitWorkflowOptions` type in `workers/commit/types.ts`
- [x] 1.2 Update `runCommitWorkflow` signature in `workers/commit/commit.ts` to accept `onProgress?: (phase: string, detail?: string) => void` and `onAbort?: () => void`
- [x] 1.3 Add `onProgress` calls at each major step: validation-start, scope-detection, message-generation, approval, post-checks, commit
- [x] 1.4 Add `onAbort` call in error/abort handling paths
- [x] 1.5 Keep `WorkflowTerminalUi` as the default when `!process.env.PI_CODING_AGENT` (backward compat)
- [x] 1.6 Use `onProgress`/`onAbort` interface when `process.env.PI_CODING_AGENT === 'true'`

## 2. TUI progress reporter adapter

- [x] 2.1 Created `createPiProgressReporter(options: { ctx, onProgress?, onAbort? })` in `workers/commit/terminal/ui.ts`
- [x] 2.2 `createPiProgressReporter` returns object with `onProgress(phase, detail)` that calls `ctx.ui.setWorkingMessage(phase)`, `ctx.ui.setStatus(...)`, and `ctx.ui.setWidget(...)`
- [x] 2.3 Created `createPiCommitProgressUiState(phase, detail, result?)` in `pi-customization/src/ui.ts` for detailed gate status widgets
- [x] 2.4 Wired `createPiProgressReporter` into `executePiCommitSession` in `tools/commit.ts` when `options.tuiMode` is true (accepts `ctx` parameter, wires reporter when tuiMode=true)

## 3. Remove global TUI confirm singleton

- [x] 3.1 Remove `_tuiConfirmCb` module variable from `tools/commit.ts` (replaced with per-call `tuiConfirm` option)
- [x] 3.2 Remove `setTuiConfirm` export from `tools/commit.ts` and all re-exports (llm-agents/src/index.ts, pi-customization/src/tools.ts, pi-customization/src/index.ts)
- [x] 3.3 Add `tuiConfirm?: (question: string) => Promise<boolean>` to `CommitWorkflowOptions` type in `workers/commit/types.ts`
- [x] 3.4 Pass `tuiConfirm` through: `tools.ts` tool → `executePiCommitSession` → `executePiCommitWorkflow` → `runCommitWorkflow` (full chain)
- [x] 3.5 Update `confirmPrompt` in `workers/commit/message.ts` to accept `tuiConfirm` as explicit parameter (replaces global singleton)
- [x] 3.6 Remove `finally` block cleanup — `tuiConfirm` is per-call via options, no global state to clear

## 4. File artifact isolation

- [x] 4.1 Update `writeCommitReport` in `workers/commit/message.ts` to write to `.pi/artifacts/llm/reports/llm-commit.md` (from `artifacts/llm/reports/`)
- [x] 4.2 Create `.pi/artifacts/llm/reports/` directory lazily with `mkdir(..., { recursive: true })` in `writeCommitReport`
- [x] 4.3 `writeChangesetFile` already tracks generated files — verified they are included in staging
- [x] 4.4 `.pi/` is gitignored — no staging needed for artifact files
- [x] 4.5 Update `assertNoUnexpectedChanges` to exclude `.pi/` directory from the check

## 5. Unified command and tool entry points

- [x] 5.1 Updated `/repo-commit` command in `pi-customization/src/commands/repo-actions.ts` to use `tuiConfirm` option
- [x] 5.2 Both command and tool call `executePiCommitSession` with identical options structure (`tuiMode`, `singlePassApproval`, `tuiConfirm`)
- [x] 5.3 Standardized `tuiMode` and `singlePassApproval` to use `ctx.hasUI` for both entry points
- [x] 5.4 Removed duplicate confirmation logic — single `confirmPrompt` path in the workflow

## 6. PI TUI progress reporting in tool

- [x] 6.1 Updated `repo_commit_workflow` tool's `execute()` in `tools.ts` to use `onProgress` for progress streaming
- [x] 6.2 Call `ctx.ui.setWorkingVisible(true)` and `ctx.ui.setWorkingMessage(phase)` from `onProgress` (via `createPiProgressReporter`)
- [x] 6.3 Call `ctx.ui.setStatus()` with commit workflow summary on each phase transition
- [x] 6.4 Call `ctx.ui.setWidget()` with detailed gate status using `createPiCommitProgressUiState` in progress reporting
- [x] 6.5 Pass `ctx.signal` to the workflow for cancellation support (via `executePiCommitSession` → `executePiCommitWorkflow` → `runCommitWorkflow`)

## 7. Cancellation support

- [x] 7.1 Pass `ctx.signal` from tool's `execute()` through `executePiCommitSession` → `executePiCommitWorkflow` → `runCommitWorkflow` (signal passed through full chain)
- [x] 7.2 In `runCommitWorkflow`, check `signal.aborted` at each major step before proceeding (checked at 6 points: after validation, policy, scopes, message, approval, post-checks)
- [x] 7.3 If aborted, call `onAbort()` and return `null` (workflow returns null on abort)
- [x] 7.4 In abort path, clean up generated files via `cleanupGeneratedFiles()` (removes `.pi/artifacts/llm/reports/` directory)
- [x] 7.5 Update `PiCommitWorkflowResult` type to include `aborted?: boolean` field

## 8. Testing and verification

- [x] 8.1 `pnpm --filter @cfxdevkit/llm-agents build` passes ✓
- [x] 8.2 `pnpm --filter @cfxdevkit/llm-agents test` passes ✓ (43/43 tests)
- [x] 8.3 CLI usage preserved — `WorkflowTerminalUi` used when `PI_CODING_AGENT !== 'true'`
- [ ] 8.4 Manual TUI testing: Test `/repo-commit` in PI TUI with: success, validation failure, abort scenarios
- [x] 8.5 Artifact isolation verified — writes to `.pi/artifacts/` which is gitignored
- [ ] 8.6 `pnpm run repo:check` — Typecheck/Repo check failures in pre-existing packages (`devnode-server`, `showcase-local`); Hotspots gate ✓
- [ ] 8.7 `pnpm --filter @cfxdevkit/tooling-cli tooling check validation` — needs manual run in fresh environment
