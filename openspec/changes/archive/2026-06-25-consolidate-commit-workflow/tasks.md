## 1. Change `handleCommit()` in `llm-agents/src/commands.ts`

**File**: `repos/cfx-tools/infra/llm-agents/src/commands.ts`

**Change to**: Import `executePiCommitSession` from `@cfxdevkit/pi-agent` and call it directly with `tuiMode: true`.

- [x] 1. Add import: `import { executePiCommitSession } from '@cfxdevkit/pi-agent';`
- [x] 2. Replace `handleCommit()` body to call `executePiCommitSession({ tuiMode: true, prompt })` directly
- [x] 3. Handle the result similarly to the current `runPiCommit()` flow (display status, handle approval if needed)

## 2. Remove `runPiCommit()` from `pi-agent/src/runtime.ts`

**File**: `repos/cfx-tools/infra/pi-agent/src/runtime.ts`

**Change**: Remove `runPiCommit()` entirely. It's redundant with `executePiCommitSession()` in `tools/commit.ts`.

- [x] 1. Remove `runPiCommit()` function
- [x] 2. Remove `PiAgentCommitOptions` interface (if no longer used)
- [x] 3. Remove `buildCommitSessionPrompt()` function (only used by `runPiCommit()`)
- [x] 4. Update exports in `pi-agent/src/index.ts` to remove `runPiCommit`

## 3. Update `pi-agent/src/index.ts` Exports

- [x] 1. Remove `runPiCommit` from import statement
- [x] 2. Remove `runPiCommit` from export statement
- [x] 3. Export `executePiCommitSession` for llm-agents consumption

## 4. Verify `executePiCommitSession()` in `tools/commit.ts` is Complete

- [x] 1. Verify it covers all use cases currently handled by `handleCommit()`:
  - `tuiMode: true` flag ✓
  - `singlePassApproval: true` for TUI-native approval ✓
  - `prompt` for operator context ✓
  - `quick` flag ✓
  - `model` override ✓

## 5. Verify Chat/Agent Modes Still Work

- [x] 1. `runPiInteractive()` still spawns `pi` binary (intentional for TTY chat mode)
- [x] 2. `runPiPrint()` still spawns `pi` binary (intentional for print mode)
- [x] 3. `runPiRpc()` still spawns `pi` binary (intentional for RPC mode)

## 6. Run Full Test Suite

- [x] 1. `pnpm --filter @cfxdevkit/pi-agent test` — 30/30 tests pass
- [x] 2. `pnpm --filter @cfxdevkit/llm-agents exec tsc --noEmit` — typecheck passes

## 7. Verify Moon Tasks

- [x] 1. `moon run tooling-cli:repo-commit` → now calls `handleCommit()` → `executePiCommitSession()` directly
- [x] 2. `moon run tooling-cli:repo-precommit` → unchanged, uses `runPrecommitWorkflow` directly
- [x] 3. `moon run tooling-cli:agent-chat` → still spawns `pi` for TTY (intentional)
