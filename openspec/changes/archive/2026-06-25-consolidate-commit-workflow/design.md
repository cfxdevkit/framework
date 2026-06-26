# Design: Consolidate Commit Workflow

## Current State

### Entry Points

```
moon run tooling-cli:repo-commit
  └── pnpm --filter @cfxdevkit/llm-agents agent-commit
       └── tsx src/bin.ts commit
            └── handleCommit()
                 └── runPiCommit()
                      └── runPiInteractive()
                           └── spawnPnpm(piBinaryPath) → spawns 'pi' binary
                                └── NESTED TUI (BREAKS PARENT)
```

```
pnpm run tooling-cli:agent-chat
  └── tsx src/bin.ts chat
       └── handleChat()
            └── runPiInteractive()
                 └── spawnPnpm(piBinaryPath) → spawns 'pi' binary
                      └── CHAT MODE (intentional TTY)
```

```
/pi-agent: /repo-commit (TUI command)
  └── registerRepoCommitCommand()
       └── executePiCommitSession({ tuiMode: true })
            └── executePiCommitWorkflow()
                 └── direct import of @cfxdevkit/llm-agents (NO SPAWN)
                      └── ✅ WORKS
```

```
/pi-agent: repo_commit_workflow tool
  └── executePiCommitSession({ tuiMode: ctx.hasUI })
       └── executePiCommitWorkflow()
            └── direct import of @cfxdevkit/llm-agents (NO SPAWN)
                 └── ✅ WORKS
```

### Files That Spawn the `pi` Binary

Only `pi-agent/src/runtime.ts` has `spawnPnpm()` which is called by:
- `runPiInteractive()` → used by `handleChat()`, `handleCommit()`, `handlePrint()`, `handleRpc()`
- `runPiCommit()` → calls `runPiInteractive()` with commit prompt
- `runPiPrint()` → calls `runPiCli()` with mode 'print'
- `runPiRpc()` → calls `runPiCli()` with mode 'rpc'

The spawning is **intentional** for chat/agent modes (user needs interactive TTY), but **wrong** for commit/precommit workflows (should be direct module import).

### Files That Import Directly (Correct)

- `pi-agent/src/tools/commit.ts` → `executePiCommitWorkflow()` (direct import of `@cfxdevkit/llm-agents`)
- `pi-agent/src/commands/repo-commit.ts` → `executePiCommitSession()` (from `tools/commit.ts`)
- `pi-agent/src/tools.ts` → `executePiCommitSession()` (from `tools/commit.ts`)
- `llm-agents/workers/commit/precommit.ts` → `runPrecommitWorkflow()` (worker module, direct)
- `llm-agents/src/commands.ts` → `handleDeterministic()` → `runPrecommitWorkflow()` (direct, no spawn)
- `cdk-repo-check/src/repo-check/commands.ts` → `runStructuredRepoCommand()` (executes `pnpm run <script>`)
- `llm-agents/workers/commit/gates.ts` → uses `runRepoCheck()` / `runRepoCommand()` (direct import)

### The Bug

`llm-agents/src/commands.ts` → `handleCommit()` calls `runPiCommit()` → spawns `pi` binary.
This is **different** from `pi-agent/src/tools/commit.ts` → `executePiCommitSession()` which uses direct import.

The fix: change `handleCommit()` to use direct import of `@cfxdevkit/llm-agents` worker, same as `pi-agent/src/tools/commit.ts`.

## Target State

### Entry Points (All Use Direct Import)

```
moon run tooling-cli:repo-commit
  └── pnpm --filter @cfxdevkit/llm-agents agent-commit
       └── tsx src/bin.ts commit
            └── handleCommit()
                 └── executePiCommitSession()
                      └── executePiCommitWorkflow()
                           └── direct import of @cfxdevkit/llm-agents (NO SPAWN)
                                └── ✅ WORKS (same as TUI)
```

```
moon run tooling-cli:agent-chat
  └── tsx src/bin.ts chat
       └── handleChat()
            └── runPiInteractive()
                 └── spawnPnpm(piBinaryPath) → spawns 'pi' binary
                      └── CHAT MODE (intentional TTY)
```

### Unified Path

All commit/precommit workflows share one path:

```
@cfxdevkit/llm-agents
  └── workers/commit/index.ts
       └── runCommitWorkflow() / runPrecommitWorkflow()
            └── runQualityGates() / runRepositoryPolicyGates()
                 └── @cfxdevkit/cdk-repo-check
                      └── runRepoCheck() / runRepoCommand()
```

No spawning, no TTY, no `script` command. The `createWorkflowTerminalUi` in `terminal/ui.ts` detects `PI_CODING_AGENT=true` and uses sequential line output (no ANSI cursor manipulation).

### Files to Change

1. **`pi-agent/src/runtime.ts`**:
   - Keep `runPiInteractive()`, `runPiPrint()`, `runPiRpc()` (chat/agent modes, need spawn)
   - Remove `runPiCommit()` (no longer needed — `executePiCommitSession()` in `tools/commit.ts` is the single source)
   - Keep `spawnPnpm()` (needed by chat/agent modes)

2. **`pi-agent/src/commands/repo-commit.ts`**: Already correct — uses `executePiCommitSession()` from `tools/commit.ts`. No change.

3. **`pi-agent/src/tools.ts`**: Already correct — uses `executePiCommitSession()` from `tools/commit.ts`. No change.

4. **`pi-agent/src/tools/commit.ts`**: Already correct — uses `executePiCommitWorkflow()` via direct import. No change.

5. **`llm-agents/src/commands.ts`**:
   - Change `handleCommit()` to import and call `executePiCommitSession()` directly (same as `pi-agent/src/tools/commit.ts`)
   - This is the key fix — eliminates the spawn path

6. **`llm-agents/src/bin.ts`**: Already correct — delegates `handleCommit()` from `commands.ts`. No change.

7. **`llm-agents/workers/commit/terminal/ui.ts`**: Already TUI-aware. No change.

## Implementation Steps

1. **Consolidate `handleCommit()` in `llm-agents/src/commands.ts`** to use direct import of `@cfxdevkit/llm-agents` worker (`executePiCommitSession()` from `@cfxdevkit/pi-agent`).

2. **Remove `runPiCommit()` from `pi-agent/src/runtime.ts`** since it's redundant with `executePiCommitSession()` in `tools/commit.ts`.

3. **Verify all moon tasks** (`llm:commit`, `repo-commit`, `repo-precommit`, `llm:action`, `llm:all`) produce identical results regardless of whether invoked from console or TUI.

4. **Remove `spawnPnpm()` from `pi-agent/src/runtime.ts`** — only needed for chat/agent modes which call `runPiInteractive()`, `runPiPrint()`, `runPiRpc()`.

5. **Update `llm-agents/src/commands.ts`** `handleCommit()` to use `executePiCommitSession()` from `@cfxdevkit/pi-agent` (direct import, no spawn).
