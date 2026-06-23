## Context

The project's Pi extensions currently consist of a single file (`.pi/extensions/repo-agent.ts`) that re-exports `registerPiAgentProjectExtension` from pi-agent. There is no package structure, no extension lifecycle management, and no way to share extensions across projects.

Long sessions waste tokens because:
- The same `grep` or `read` is re-issued five turns later (no dedup)
- Failed 4-KB `bash` commands are sent back on every turn (no error purge)
- Initial repo scans and abandoned approaches are still in context (no compression)

Session state is lost on restart because:
- Git dirty detection state doesn't survive restarts
- No auto-stash/checkpoint mechanism
- No cross-turn state persistence

The team needs GitNexus-specific skills for impact analysis, context lookup, and rename guidance — but currently has no structured skill for this.

## Goals / Non-Goals

**Goals:**
- Create `@cfxdevkit/pi-extensions` as a local npm package with a `pi` manifest
- Integrate `npm:@davecodes/pi-dcp` for automatic context pruning
- Add session state management with dirty repo guards, checkpoints, and state persistence
- Register GitNexus and framework-check skills
- Wire everything in `.pi/settings.json` so it auto-loads on cold start

**Non-Goals:**
- Replacing `npm:@davecodes/pi-dcp` — we install the proven package as-is (AGPL-3.0)
- Building custom context compression — DCP handles this
- Replacing pi-agent's `registerPiAgentProjectExtension` — that remains the base
- Managing GitNexus MCP integration — it exists, we just register skills for it
- Building a UI framework — use pi's built-in TUI components

## Architecture

### Layer 1: Package Registry

`repos/cfx-tools/infra/pi-extensions/` is the npm package:

```
pi-extensions/
├── package.json              # name: @cfxdevkit/pi-extensions, pi.manifest
└── extensions/
    └── index.ts              # Composes all extension modules
        ├── 00-session-state.ts   # Git guard + checkpoint + persistence
        ├── 01-gitnexus.ts        # GitNexus-aware system prompt injection
        └── 02-prompt-customizer.ts  # Context-aware tool guidance
```

The `package.json` `pi` manifest tells Pi where to find extensions and skills:
```json
{
  "name": "@cfxdevkit/pi-extensions",
  "version": "1.0.0",
  "keywords": ["pi-package"],
  "pi": {
    "extensions": ["./extensions"],
    "skills": ["./skills"]
  }
}
```

### Layer 2: DCP Integration (npm package)

`npm:@davecodes/pi-dcp` is installed as a pi package. It auto-discovers via its own `pi.extensions` entry point and registers:
- The `compress` LLM tool (range mode + message mode)
- `/dcp` slash commands (context, stats, sweep, manual, decompress)
- `context` event hooks for outbound request pruning

DCP stores its own state at `~/.pi-dcp/` (config, stats, prompts, logs) — completely independent of our package.

### Layer 3: Session State Management Extension

The `00-session-state.ts` extension combines three sub-capabilities using patterns from pi-coding-agent examples:

**Dirty Repo Guard:**
- Event: `session_before_switch`, `session_before_fork`
- Pattern: modeled on `examples/extensions/dirty-repo-guard.ts`
- Runs `git status --porcelain`, prompts user via `ctx.ui.select()` if changes exist

**Git Checkpoint:**
- Event: `turn_start` (after user reply) — auto-stash
- Event: `session_shutdown` — restore stashed changes
- Pattern: modeled on `examples/extensions/git-checkpoint.ts`

**State Persistence:**
- Event: `session_start` — restore state via `pi.getEntries()`
- Event: `session_shutdown` — persist state via `pi.appendEntry()`
- Stores: git checkpoint info, dirty detection status, workflow state

### Layer 4: Skills

Skills are stored in `.pi/skills/` (versioned in the repo). Two new skills:

**GitNexus Skill** (`.pi/skills/gitnexus/SKILL.md`):
- Impact analysis workflow: `impact()`, `detect_changes()`, `context()`
- CLI command reference: when to use each GitNexus tool
- Context lookup: `query()`, `fetch_content()` for exploring unfamiliar code

**Framework Check Skill** (`.pi/skills/framework-check/SKILL.md`):
- Changeset validation: `detect_changes()` expected scope verification
- Code quality gates: lint, typecheck, test verification
- Policy gate checks: required approvals, branch rules

## Configuration

### `.pi/settings.json` packages array
```json
{
  "packages": [
    "npm:@davecodes/pi-dcp",
    "./repos/cfx-tools/infra/pi-extensions"
  ]
}
```

### `.pi/settings.json` skills array
```json
{
  "skills": [
    ".pi/skills",
    "./repos/cfx-tools/infra/pi-extensions/skills"
  ]
}
```

### `.pi/dcp.json` (project-level DCP overrides)
```json
{
  "compress": {
    "minContextLimit": 30000,
    "maxContextLimit": 70000,
    "nudgeForce": "strong"
  },
  "strategies": {
    "deduplication": { "enabled": true },
    "purgeErrors": { "enabled": true, "turns": 2 }
  }
}
```

## Extension Patterns Used

All extension patterns are sourced from `@earendil-works/pi-coding-agent/examples/extensions/`:

| Pattern | Source File | Used By |
|---------|-------------|---------|
| Dirty repo guard | `dirty-repo-guard.ts` | `00-session-state.ts` |
| Git checkpoint | `git-checkpoint.ts` | `00-session-state.ts` |
| Session persistence | `todo.ts` (appendEntry pattern) | `00-session-state.ts` |
| Event bus | `event-bus.ts` | Cross-extension communication |
| Prompt customizer | `prompt-customizer.ts` | `02-prompt-customizer.ts` |
| Dynamic tools | `dynamic-tools.ts` | Optional future tools |
| System prompt header | `system-prompt-header.ts` | `01-gitnexus.ts` |

## Implementation Order

1. **Package Foundation** — Create npm package, update settings.json
2. **DCP Integration** — Add npm package, verify compress tool
3. **Session State Extension** — Implement dirty guard, checkpoint, persistence
4. **Skills Setup** — Create GitNexus and framework-check SKILL.md files
5. **Prompt Customizer** — Create context-aware guidance extension
6. **Documentation** — Update SETUP.md, create migration docs
7. **Verification** — Test all extensions load, DCP works, state persists
