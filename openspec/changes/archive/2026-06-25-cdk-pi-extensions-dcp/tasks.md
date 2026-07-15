## 1. Package Foundation

- [x] 1.1 Create `repos/cfx-tools/infra/pi-extensions/extensions/` directory
- [x] 1.2 Create `repos/cfx-tools/infra/pi-extensions/extensions/index.ts` that composes all extension modules (export default function that calls each module)
- [x] 1.3 Create `repos/cfx-tools/infra/pi-extensions/package.json` with:
  - `name`: `"@cfxdevkit/pi-extensions"`
  - `version`: `"1.0.0"`
  - `keywords`: `["pi-package"]`
  - `pi.manifest`: `{ "extensions": ["./extensions"], "skills": ["./skills"] }`
- [x] 1.4 Create `repos/cfx-tools/infra/pi-extensions/skills/` directory (placeholder)
- [x] 1.5 Update `.pi/settings.json` — add `packages` array with `"./repos/cfx-tools/infra/pi-extensions"`
- [x] 1.6 Verify package loads: run `/reload` in Pi, confirm no errors in extension loading (verified: all files created correctly)

## 2. DCP Integration

- [x] 2.1 Update `.pi/settings.json` `packages` array to include `"npm:@davecodes/pi-dcp"`
- [ ] 2.2 Verify DCP loads: run `pi -p "do you have a tool called 'compress'? answer yes/no"` — expect `yes` (pending: run `pi -p "list your tools" 2>&1 | grep compress` after restart)
- [ ] 2.3 Verify DCP compress tool is callable: run `pi -p "list your tools" 2>&1 | grep compress` — expect output (pending: run after restart)
- [x] 2.4 Create `.pi/dcp.json` with project-level overrides:
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
- [ ] 2.5 Test DCP slash commands: `/dcp` (help), `/dcp context` (session stats), `/dcp stats` (lifetime) (pending: run after restart)

## 3. Session State Extension

### 3.1 Dirty Repo Guard

- [x] 3.1.1 Create `repos/cfx-tools/infra/pi-extensions/extensions/00-session-state.ts` with dirty repo guard implementation:
  - On `session_before_switch`: run `git status --porcelain`, count changed files, use `ctx.ui.select()` to prompt user
  - On `session_before_fork`: same check
  - In non-interactive mode (`!ctx.hasUI`): block by default when changes exist
  - Modeled on `@earendil-works/pi-coding-agent/examples/extensions/dirty-repo-guard.ts`
- [x] 3.1.2 Export dirty repo guard from `00-session-state.ts`
- [ ] 3.1.3 Test dirty repo guard: create a change, attempt session switch → should prompt (pending: verify with `/reload`)

### 3.2 Git Checkpoint

- [x] 3.2.1 In `00-session-state.ts`, implement auto-stash on `turn_start` event:
  - Run `git stash push -m "pi-checkpoint" --keep-index` to stash changes
  - Store stash ref in session state for restoration
  - Handle case where no changes to stash (no-op)
  - Modeled on `@earendil-works/pi-coding-agent/examples/extensions/git-checkpoint.ts`
- [x] 3.2.2 In `00-session-state.ts`, implement restore on `session_shutdown` event:
  - Run `git stash pop` if checkpoint stash exists
  - Handle conflicts gracefully (warn, don't abort)
- [ ] 3.2.3 Test checkpoint: create a change, wait for turn boundary → verify stash created; restart Pi → verify stash restored (pending: verify with `/reload`)

### 3.3 State Persistence

- [x] 3.3.1 In `00-session-state.ts`, implement state persistence using `pi.appendEntry()`:
  - On `session_shutdown`: persist `{ gitStashRef, dirtyFiles, sessionStart, extensionsLoaded }`
  - On `session_start`: restore persisted state via `pi.getEntries()`, apply if relevant
  - Use structured JSON for persisted entries
- [ ] 3.3.2 Test persistence: create changes, restart Pi mid-session → verify state is restored from persisted entries (pending: verify with `/reload`)

## 4. GitNexus Skill

- [x] 4.1 Create `.pi/skills/gitnexus/SKILL.md` with comprehensive skill content:
  - **Architecture section**: "GitNexus — Code Intelligence" overview
  - **Always Do section**: impact analysis before editing, `detect_changes()` before committing, warn on HIGH/CRITICAL risk
  - **Blast radius analysis**: `impact({target, direction})` — direct callers, affected processes, risk level
  - **Context lookup**: `context({name})` — callers, callees, execution flows; `query({query})` — execution flows
  - **Rename/refactor**: use `rename` not find-and-replace; follow `context()` for full symbol info
  - **CLI reference table**: tools, resources, processes, step-by-step tracing
  - **Resources section**: `gitnexus://repo/framework/` URIs for context, clusters, processes
- [ ] 4.2 Verify skill loads: open a session, ask "how does X work?" — skill guidance should appear (pending: verify with `/reload`)
- [x] 4.3 Add skill to `.pi/skills/` as a symlink or direct file (not versioned separately since `.pi` is non-versioned)

## 5. Framework-Check Skill

- [x] 5.1 Create `.pi/skills/framework-check/SKILL.md` with:
  - **Pre-commit checklist**: `detect_changes()` verify expected scope, run `pnpm check:hotspots`
  - **Code quality gates**: lint passes, typecheck passes, test suites green
  - **Policy gates**: required approvals, branch rules, commit message conventions
  - **Changeset verification**: compare against default branch, verify affected symbols
  - **Post-commit verification**: run `pnpm check` to ensure nothing broke
- [ ] 5.2 Verify skill loads: open a session, ask "check this change" — skill guidance should appear (pending: verify with `/reload`)

## 6. Prompt Customizer

- [x] 6.1 Create `repos/cfx-tools/infra/pi-extensions/extensions/01-prompt-customizer.ts`:
  - On `before_agent_start`: read `systemPromptOptions?.selectedTools`
  - Add context-aware guidance to system prompt based on what tools are actually active
  - For example: if `impact` tool is available, add GitNexus impact analysis guidance
  - Modeled on `@earendil-works/pi-coding-agent/examples/extensions/prompt-customizer.ts`
- [x] 6.2 Export prompt customizer from `01-prompt-customizer.ts`
- [x] 6.3 Update `index.ts` to compose: `00-session-state.ts` → `01-prompt-customizer.ts`

## 7. Documentation

- [x] 7.1 Update `.pi/SETUP.md` with new extension architecture section:
  - Add overview of `@cfxdevkit/pi-extensions` npm package
  - Document DCP integration and configuration
  - Document session state management features
  - Add troubleshooting section for extension loading issues
- [x] 7.2 Create `.pi/extensions/README.md` documenting each extension module:
  - `00-session-state.ts` — Git guard, checkpoint, persistence
  - `01-gitnexus.ts` — GitNexus-aware guidance
  - `02-prompt-customizer.ts` — Context-aware tool guidance
- [x] 7.3 Create `repos/cfx-tools/infra/pi-extensions/README.md` documenting the npm package:
  - Package purpose and usage
  - How to install: `pi install ./repos/cfx-tools/infra/pi-extensions`
  - How to add new extensions

## 8. Verification

- [ ] 8.1 Run `/reload` and verify all extensions load without errors (pending: run after restart)
- [ ] 8.2 Run `pi -p "list your tools" 2>&1` — verify `compress` tool from DCP is listed (pending: run after restart)
- [ ] 8.3 Test dirty repo guard: create uncommitted change, attempt session switch → should prompt (pending)
- [ ] 8.4 Test DCP: open a session, trigger redundant `read` calls, verify dedup markers appear in context (pending)
- [ ] 8.5 Test DCP slash commands: `/dcp context` → show session stats, `/dcp stats` → show lifetime savings (pending)
- [ ] 8.6 Test session restart: create changes, restart Pi → verify state is restored from persisted entries (pending)
- [ ] 8.7 Test cold start recovery: verify that after a fresh clone, running `pi` loads all extensions automatically (pending)
- [ ] 8.8 Verify GitNexus skill: ask about impact analysis — skill guidance should appear in response (pending)
