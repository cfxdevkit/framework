# Proposal: Consolidate Commit Workflow Entry Points

## Problem

There are **four commit entry points** that overlap, with inconsistent behavior:

| Entry Point | Invocation | Path | TUI-safe? |
|---|---|---|---|
| `llm:commit` | `moon run tooling-cli:repo-commit` | → `pnpm --filter @cfxdevkit/llm-agents agent-commit` → `tsx bin.ts commit` → `runPiCommit()` → spawns `pi` binary | ❌ breaks TUI |
| `pnpm run repo-precommit` | `moon run tooling-cli:repo-precommit` | → `pnpm --filter @cfxdevkit/llm-agents deterministic precommit` | ✅ works |
| `/repo-commit` | TUI command | → `executePiCommitSession()` (direct import) | ✅ works |
| `repo_commit_workflow` | TUI tool | → `executePiCommitSession()` (direct import) | ✅ works |

The first entry point (`llm:commit`) **spawns a nested `pi` binary** via `spawnPnpm()` which creates a pseudo-TTY with `script`. This:
1. Steals terminal control from the parent TUI
2. ANSI cursor manipulation (`moveCursor`, `clearScreenDown`) in the commit workflow's `createWorkflowTerminalUi` corrupts parent TUI rendering
3. Approval prompts (`confirm`) use readline, conflicting with parent TUI's stdin/stdout

The moon tasks `llm:commit`, `llm:action`, `llm:all`, and all `moon run tooling-cli:agent-*` scripts follow the same pattern — they run `tsx bin.ts <command>` which eventually calls `runPiInteractive()` → `spawnPnpm(piBinaryPath)` → nested TUI.

## Solution

**Never spawn the `pi` binary from commit/exploratory workflows.** All entry points use the same `@cfxdevkit/llm-agents` worker modules (`runCommitWorkflow`, `runPrecommitWorkflow`, `runAll`, etc.) via direct import. The moon tasks should call these worker modules directly, not through `tsx bin.ts` or `pi` binary.

### Key Principles

1. **Single implementation path**: All commit workflows share `@cfxdevkit/llm-agents` worker modules — no spawning, no TTY tricks.
2. **Console/TUI parity**: The same code runs identically in console and TUI. `PI_CODING_AGENT=true` disables ANSI cursor manipulation, but the workflow logic is identical.
3. **No child process spawning**: Remove `spawnPnpm()` from `pi-agent/src/runtime.ts` for commit/precommit paths. Only `runPiInteractive`, `runPiPrint`, and `runPiRpc` (the chat/agent modes) need to spawn the `pi` binary — these are the only paths that genuinely need a TTY.

### What Changes

1. **`pi-agent/src/runtime.ts`**: Remove `runPiCommit()` and `runPiInteractive()` spawning paths. Keep `runPiInteractive`, `runPiPrint`, `runPiRpc` for chat agent modes only.
2. **`pi-agent/src/tools/commit.ts`**: Already correct — uses direct import via `executePiCommitWorkflow()`.
3. **`pi-agent/src/commands/repo-commit.ts`**: Already correct — uses `executePiCommitSession()` from `tools/commit.ts`.
4. **`pi-agent/src/tools.ts`**: Already correct — uses `executePiCommitSession()`.
5. **`llm-agents/src/commands.ts`**: `handleCommit()` calls `runPiCommit()` which spawns. Change to call `executePiCommitSession()` directly.
6. **`llm-agents/src/bin.ts`**: `commit` subcommand delegates to `handleCommit()`. Update to use direct module import.
7. **`llm-agents/workers/commit/terminal/ui.ts`**: Already TUI-aware — `PI_CODING_AGENT=true` disables interactive cursor manipulation. No changes needed.

### What Stays

- **`/repo-commit` TUI command** — already correct
- **`repo_commit_workflow` tool** — already correct
- **`deterministic precommit`** — already correct (direct import, no spawn)
- **`runPiInteractive`, `runPiPrint`, `runPiRpc`** — these are the chat/agent modes that genuinely need to spawn the `pi` binary for interactive TTY sessions
- **`createWorkflowTerminalUi`** — already handles `PI_CODING_AGENT` by using sequential line output
