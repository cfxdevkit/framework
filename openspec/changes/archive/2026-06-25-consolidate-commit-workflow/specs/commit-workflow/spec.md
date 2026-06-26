# Spec: Commit Workflow Consolidation

## Requirements

### 1. No Child Process Spawning for Commit/Precommit Workflows

**MUST** ensure that `runCommitWorkflow()` and `runPrecommitWorkflow()` from `@cfxdevkit/llm-agents` are called via direct module import, never via `spawnPnpm()` or any child process.

**MUST NOT** spawn the `pi` binary for commit, precommit, or exploratory workflows (actions, changeset, health, etc.).

### 2. TUI-Compatible Output

**MUST** set `PI_CODING_AGENT=true` at module load time for all commit/precommit workflow paths so that `createWorkflowTerminalUi()` detects TUI mode and uses sequential line output instead of ANSI cursor manipulation.

**MUST NOT** use `moveCursor`, `clearScreenDown`, or any ANSI cursor control codes when `PI_CODING_AGENT=true`.

### 3. Unified Implementation Path

**MUST** ensure all commit entry points use the same `@cfxdevkit/llm-agents` worker modules:
- `workers/commit/index.ts` → `runCommitWorkflow()` / `runPrecommitWorkflow()`
- `workers/commit/gates.ts` → `runQualityGates()` / `runRepositoryPolicyGates()`
- `workers/commit/changeset.ts` → `generateChangesetPlan()`
- `workers/commit/message.ts` → `generateCommitMessage()` / `executeCommit()`

### 4. Single Source of Truth for `executePiCommitSession()`

**MUST** use `executePiCommitSession()` from `@cfxdevkit/pi-agent` (`tools/commit.ts`) as the single entry point for all commit workflows that need to be TUI-compatible.

**MUST NOT** have multiple implementations of `executePiCommitSession()` — only one in `pi-agent/src/tools/commit.ts`.

### 5. Chat/Agent Modes Remain Separate

**MUST** keep `runPiInteractive()`, `runPiPrint()`, `runPiRpc()` in `pi-agent/src/runtime.ts` for chat/agent modes that genuinely require interactive TTY sessions.

**MUST** keep `spawnPnpm()` in `pi-agent/src/runtime.ts` only as a private function called by `runPiInteractive()`, `runPiPrint()`, `runPiRpc()`.

## Acceptance Criteria

- [ ] `moon run tooling-cli:repo-commit` produces identical output in console and TUI
- [ ] `moon run tooling-cli:repo-precommit` produces identical output in console and TUI
- [ ] `/repo-commit` TUI command works without spawning child processes
- [ ] `repo_commit_workflow` tool works without spawning child processes
- [ ] No ANSI cursor manipulation (`moveCursor`, `clearScreenDown`) when `PI_CODING_AGENT=true`
- [ ] `llm:commit` moon task uses direct module import, not `spawnPnpm()`
- [ ] `handleCommit()` in `llm-agents/src/commands.ts` uses `executePiCommitSession()` directly
- [ ] `runPiCommit()` removed from `pi-agent/src/runtime.ts` (redundant)
- [ ] All commit entry points share `@cfxdevkit/llm-agents` worker modules via direct import
