---
name: openspec-apply-change
description: Implement tasks from an OpenSpec change. Use when the user wants to start implementing, continue implementation, or work through tasks.
license: MIT
compatibility: Requires openspec CLI.
metadata:
  author: openspec
  version: "1.0"
  generatedBy: "1.3.1"
---

Implement tasks from an OpenSpec change.

**Input**: Optionally specify a change name. If omitted, check if it can be inferred from conversation context. If vague or ambiguous you MUST prompt for available changes.

**Branch Rule**: This change MUST be on its own branch. Never work on the default
branch during implementation. Commits during implementation use `/repo-commit`
with TUI-native approval.

**Steps**

1. **Select the change**

   If a name is provided, use it. Otherwise:
   - Infer from conversation context if the user mentioned a change
   - Auto-select if only one active change exists
   - If ambiguous, run `openspec list --json` to get available changes and use the **AskUserQuestion tool** to let the user select

   Always announce: "Using change: <name>" and how to override (e.g., `/opsx-apply <other>`).

2. **Check status to understand the schema**
   ```bash
   openspec status --change "<name>" --json
   ```
   Parse the JSON to understand:
   - `schemaName`: The workflow being used (e.g., "spec-driven")
   - Which artifact contains the tasks (typically "tasks" for spec-driven, check status for others)

3. **Get apply instructions**

   ```bash
   openspec instructions apply --change "<name>" --json
   ```

   This returns:
   - `contextFiles`: artifact ID -> array of concrete file paths (varies by schema - could be proposal/specs/design/tasks or spec/tests/implementation/docs)
   - Progress (total, complete, remaining)
   - Task list with status
   - Dynamic instruction based on current state

   **Handle states:**
   - If `state: "blocked"` (missing artifacts): show message, suggest using openspec-continue-change
   - If `state: "all_done"`: congratulate, suggest archive
   - Otherwise: proceed to implementation

4. **Read context files**

   Read every file path listed under `contextFiles` from the apply instructions output.
   The files depend on the schema being used:
   - **spec-driven**: proposal, specs, design, tasks
   - Other schemas: follow the contextFiles from CLI output

5. **Show current progress**

   Display:
   - Schema being used
   - Progress: "N/M tasks complete"
   - Remaining tasks overview
   - Dynamic instruction from CLI
   - **Branch**: confirm the change is on its own branch

6. **Implement tasks (loop until done or blocked)**

   For each pending task:
   - Show which task is being worked on
   - Make the code changes required
   - Keep changes minimal and focused
   - **Run `repo precommit` after completing each major group of tasks** (not after every single task — batch by logical grouping)
     - This catches issues early and keeps the working tree healthy
     - If precommit fails: fix the failures before continuing, or run `repo_agent_check` for structural issues
   - Mark task complete in the tasks file: `- [ ]` → `- [x]`
   - **Commit changes after each task or logical group** using `/repo-commit`
     - The commit workflow handles approval via TUI-native dialog
     - Each commit should be atomic and focused

   **Pause if:**
   - Task is unclear → ask for clarification
   - Implementation reveals a design issue → suggest updating artifacts
   - Error or blocker encountered → report and wait for guidance
   - User interrupts

7. **Validate after all tasks complete**

   Once all tasks are marked done, run the full precommit gate:
   ```bash
   repo precommit
   ```
   This runs the complete sequence: format → lint → typecheck → **tests** → build → repo-check.
   Do NOT use `repo check` or `repo_agent_check` alone — those skip tests.

   - **If precommit passes**: congratulate, suggest archive with `/opsx-archive`
   - **If precommit fails**: surface the failing gate(s). Fix the failures before suggesting
     archive. Offer to call `repo_agent_check` to auto-create follow-up OpenSpec changes for
     structural failures. Do NOT archive until `repo precommit` returns `status: passed`.

8. **On completion or pause, show status**

   Display:
   - Tasks completed this session
   - Overall progress: "N/M tasks complete"
   - Validation result (pass / fail + step names)
   - If all done and clean: suggest archive
   - If paused: explain why and wait for guidance

**Output During Implementation**

```
## Implementing: <change-name> (schema: <schema-name>)

Working on task 3/7: <task description>
[...implementation happening...]
✓ Task complete
✓ Precommit: passed (format ✓ lint ✓ typecheck ✓ tests ✓ build ✓ repo-check ✓)
✓ Committed: feat: implement task 3

Working on task 4/7: <task description>
[...implementation happening...]
✓ Task complete
```

**Output On Completion**

```
## Implementation Complete

**Change:** <change-name>
**Schema:** <schema-name>
**Progress:** 7/7 tasks complete ✓
**Branch:** <branch-name> (ready to merge)
**Validation:** ✓ `repo precommit` passed

### Completed This Session
- [x] Task 1
- [x] Task 2
...

All tasks complete and `repo precommit` clean! Ready to archive with `/opsx-archive`.
```

**Output On Pause (Issue Encountered)**

```
## Implementation Paused

**Change:** <change-name>
**Schema:** <schema-name>
**Progress:** 4/7 tasks complete
**Precommit:** ✗ <failing gates>

### Issue Encountered
<description of the issue>

**Options:**
1. Fix the failing gate(s)
2. Run `repo_agent_check` to create follow-up changes
3. Other approach

What would you like to do?
```

**Guardrails**
- **Every change is on its own branch** — never implement on default branch
- **Changes are merged when archived** — the branch lifecycle ends at archive
- Keep going through tasks until done or blocked
- Always read context files before starting (from the apply instructions output)
- If task is ambiguous, pause and ask before implementing
- If implementation reveals issues, pause and suggest artifact updates
- Keep code changes minimal and scoped to each task
- Run `repo precommit` after each logical group of tasks (not every single task)
- Update task checkbox immediately after completing each task
- Pause on errors, blockers, or unclear requirements - don't guess
- Use contextFiles from CLI output, don't assume specific file names

**Fluid Workflow Integration**

This skill supports the "actions on a change" model:

- **Can be invoked anytime**: Before all artifacts are done (if tasks exist), after partial implementation, interleaved with other actions
- **Allows artifact updates**: If implementation reveals design issues, suggest updating artifacts - not phase-locked, work fluidly
- **TUI-native commits**: Use `/repo-commit` for commits during implementation
