# Tasks: Consolidate Commit Workflow

## 1. Change `handleCommit()` in `llm-agents/src/commands.ts`

**File**: `repos/cfx-tools/infra/llm-agents/src/commands.ts`

**Current**: `handleCommit()` calls `runPiCommit()` which spawns the `pi` binary via `runPiInteractive()` → `spawnPnpm()`.

**Change to**: Import `executePiCommitSession` from `@cfxdevkit/pi-agent` and call it directly with `tuiMode: true`.

**Steps**:
1. Add import: `import { executePiCommitSession } from '@cfxdevkit/pi-agent';`
2. Replace `handleCommit()` body to call `executePiCommitSession({ tuiMode: true, prompt })` directly
3. Handle the result similarly to the current `runPiCommit()` flow (display status, handle approval if needed)

## 2. Remove `runPiCommit()` from `pi-agent/src/runtime.ts`

**File**: `repos/cfx-tools/infra/pi-agent/src/runtime.ts`

**Current**: `runPiCommit()` calls `runPiInteractive()` which spawns the `pi` binary.

**Change**: Remove `runPiCommit()` entirely. It's redundant with `executePiCommitSession()` in `tools/commit.ts`.

**Steps**:
1. Remove `runPiCommit()` function
2. Remove `PiAgentCommitOptions` interface (if no longer used)
3. Remove `buildCommitSessionPrompt()` function (only used by `runPiCommit()`)
4. Update exports in `pi-agent/src/index.ts` to remove `runPiCommit`

## 3. Update `pi-agent/src/index.ts` Exports

**File**: `repos/cfx-tools/infra/pi-agent/src/index.ts`

**Current**: Exports `runPiCommit`, `runPiInteractive`, `runPiPrint`, `runPiRpc`.

**Change**: Remove `runPiCommit` from exports.

**Steps**:
1. Remove `runPiCommit` from import statement
2. Remove `runPiCommit` from export statement
3. Verify no other files import `runPiCommit`

## 4. Verify `executePiCommitSession()` in `tools/commit.ts` is Complete

**File**: `repos/cfx-tools/infra/pi-agent/src/tools/commit.ts`

**Current**: `executePiCommitSession()` already implements the full commit workflow with TUI support, deferred approval, and model policies.

**Action**: Verify it covers all use cases currently handled by `handleCommit()`:
- `tuiMode: true` flag
- `yes: true` for approval skip
- `prompt` for operator context
- `quick` flag
- `model` override

If anything is missing, add it to `executePiCommitSession()`.

## 5. Verify Chat/Agent Modes Still Work

**Files**: `pi-agent/src/runtime.ts`, `llm-agents/src/commands.ts`

**Action**: After removing `runPiCommit()`, verify that chat/agent modes still work:
- `moon run tooling-cli:agent-chat` → calls `handleChat()` → `runPiInteractive()` → spawns `pi` (intentional)
- `moon run tooling-cli:agent-print` → calls `handlePrint()` → `runPiPrint()` → spawns `pi` (intentional)
- `moon run tooling-cli:agent-rpc` → calls `handleRpc()` → `runPiRpc()` → spawns `pi` (intentional)

## 6. Run Full Test Suite

**Action**: Run `pnpm run check` and `pnpm run test` to verify all changes pass.

## 7. Verify Moon Tasks

**Action**: Verify these moon tasks produce identical output in console and TUI:
- `moon run tooling-cli:repo-commit`
- `moon run tooling-cli:repo-precommit`
- `moon run tooling-cli:agent-chat` (should still spawn for TTY)
