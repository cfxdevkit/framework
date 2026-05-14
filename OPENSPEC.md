# OpenSpec Workflow Guide

This document describes how to use the OpenSpec change management system in this repository, including all commands, the artifact lifecycle, and how to preserve state across long sessions or context compaction events.

---

## What is OpenSpec?

OpenSpec is a spec-driven change management CLI that structures work into a sequence of artifacts before any code is written. This repository uses the **`spec-driven`** schema, which produces four artifacts per change:

```
proposal.md   →  design.md   →  specs/   →  tasks.md
  (why/what)      (how)       (per-cap)    (checklist)
```

All change artifacts live under `openspec/changes/<change-name>/`. Completed changes are moved to `openspec/changes/archive/`.

---

## Slash Commands (Copilot Agent Shortcuts)

These trigger the corresponding OpenSpec skill files under `.github/skills/`:

| Command | What it does |
|---------|--------------|
| `/opsx:explore` | Thinking-partner mode — explore a problem without writing code |
| `/opsx:propose <name>` | Create a change and generate all artifacts in one step |
| `/opsx:apply [name]` | Read artifacts and implement all pending tasks |
| `/opsx:archive [name]` | Move a completed change to the archive |

---

## CLI Reference

All commands are run from the repo root. The `openspec` binary is available on `PATH` in this dev container.

### Create a new change
```bash
openspec new change "<kebab-case-name>"
```
Creates `openspec/changes/<name>/` with a scaffolded `.openspec.yaml`.

### List active changes
```bash
openspec list --json
```
Returns a JSON array of change names and their status.

### Check artifact status for a change
```bash
openspec status --change "<name>" --json
```
Returns:
- `schemaName` — always `spec-driven` in this repo
- `artifacts` — array with `id`, `status` (`ready`, `done`, `blocked`), and `dependencies`
- `applyRequires` — artifact IDs that must be `done` before implementation starts

### Get creation instructions for a single artifact
```bash
openspec instructions <artifact-id> --change "<name>" --json
```
Returns:
- `outputPath` — where to write the file
- `template` — the markdown structure to follow
- `instruction` — schema-specific guidance for this artifact type
- `context` — project context (constraints for the AI; do **not** copy into the file)
- `rules` — artifact rules (constraints for the AI; do **not** copy into the file)
- `dependencies` — list of already-completed artifact files to read for context

Valid artifact IDs for `spec-driven`: `proposal`, `design`, `specs`, `tasks`

### Get apply instructions (implementation phase)
```bash
openspec instructions apply --change "<name>" --json
```
Returns:
- `contextFiles` — map of artifact ID → array of file paths to read before coding
- `state` — `"ready"`, `"all_done"`, or `"blocked"`
- Task list with completion status
- `instruction` — dynamic guidance based on current state

### Archive a completed change
```bash
mkdir -p openspec/changes/archive
mv openspec/changes/<name> openspec/changes/archive/$(date +%Y-%m-%d)-<name>
```
The archive step can also be done via `/opsx:archive` which handles the date prefix automatically.

---

## Full Workflow Step-by-Step

### 1. Explore (optional)
Use `/opsx:explore` to think through the problem, map existing code, and clarify requirements before committing to a design. No code is written in this mode.

### 2. Propose
```
/opsx:propose <change-name>
```
The agent will:
1. Run `openspec new change "<name>"`
2. Call `openspec status --change "<name>" --json` to get the artifact build order
3. For each artifact in dependency order, call `openspec instructions <id> --change "<name>" --json`, read dependencies, and write the artifact file
4. Stop once all `applyRequires` artifacts are `done`

The four artifact files created:

| File | Purpose |
|------|---------|
| `proposal.md` | Problem statement, what changes, list of capabilities, impact |
| `design.md` | Architecture decisions, data models, interface contracts |
| `specs/<capability>.md` | One spec per capability — inputs, outputs, edge cases |
| `tasks.md` | Numbered checklist of implementation steps referencing exact file paths |

### 3. Apply
```
/opsx:apply [change-name]
```
The agent will:
1. Run `openspec instructions apply --change "<name>" --json`
2. Read every file listed in `contextFiles`
3. Work through each `- [ ]` task in `tasks.md`, making code changes
4. Mark each task done: `- [ ]` → `- [x]` immediately after completing it
5. Continue until all tasks are `[x]` or a blocker is hit

### 4. Validate
After all tasks are complete, always run the project validation suite:
```bash
# Lint
pnpm --filter @cfxdevkit/cas-backend lint
pnpm --filter @cfxdevkit/cas-frontend lint
pnpm --filter @cfxdevkit/cas-shared lint

# Typecheck
pnpm --filter @cfxdevkit/cas-backend typecheck
pnpm --filter @cfxdevkit/cas-frontend typecheck

# Tests
pnpm --filter @cfxdevkit/cas-backend test
pnpm --filter @cfxdevkit/cas-shared test

# Quality gates (scans all source files for violations)
pnpm llm:quality-gates
```

Quality gate hard violations must be resolved before archiving. Common violation: a source file exceeding the line-count limit (≈300 lines). Fix by splitting the file into focused modules.

### 5. Archive
```
/opsx:archive [change-name]
```
Archives the change directory with a date prefix. Only run after all tasks are `[x]` and validation passes.

---

## Context Preservation Across Compaction

AI context windows are finite. Long sessions will be compacted, and critical state can be lost. Follow these practices to ensure nothing is lost when context is compacted.

### What to preserve explicitly

When writing a session summary or handing off to a new context window, always include:

1. **Change name and artifact file paths**
   ```
   Change: cas-complete-porting
   Artifacts:
     openspec/changes/cas-complete-porting/proposal.md
     openspec/changes/cas-complete-porting/design.md
     openspec/changes/cas-complete-porting/specs/
     openspec/changes/cas-complete-porting/tasks.md
   ```

2. **Task completion state** — exact count of `[x]` vs `[ ]` tasks, and which group is next

3. **Validation outcomes** — which lint/typecheck/test commands passed or failed, and any error messages

4. **Stale dist / build state** — if a shared package was modified but not rebuilt, note it explicitly
   ```
   NOTE: @cfxdevkit/cas-shared was modified; run `pnpm --filter @cfxdevkit/cas-shared build` before typechecking dependents
   ```

5. **File-level state for partially-edited files** — if a file was read but not yet written, include the key content

6. **Blocked tasks** — describe the exact blocker so the next context can pick it up immediately

### Re-entering a change after compaction

After context compaction, the fastest way to re-orient is:

```bash
# See what artifacts exist and their status
openspec status --change "<name>" --json

# Get full implementation context
openspec instructions apply --change "<name>" --json

# Then read the tasks file to see exact completion state
cat openspec/changes/<name>/tasks.md
```

Then read the spec files referenced in `contextFiles` before continuing implementation. Do not rely on memory — always re-read the artifacts.

### Handling task-marking discipline

The task file is the canonical source of truth. Mark tasks `[x]` **immediately** after completing them — not in a batch at the end. This means:

- If context is compacted mid-session, the task file shows exactly which tasks are done
- The next agent can run `openspec instructions apply --json` and see remaining work without guessing

---

## Common Pitfalls

### Stale shared package `dist/`
When you modify a package in `packages/shared/` (or any other local workspace dep), dependent packages typecheck against the compiled `dist/` from the previous build. Fix:
```bash
pnpm --filter @cfxdevkit/cas-shared build
```

### Moon project IDs vs package filter names
This repo uses Moon as a task runner, but some projects (like `cas-backend`, `cas-frontend`) do not have top-level Moon project IDs. Use `pnpm --filter` with the package name from `package.json` instead:
```bash
# Correct
pnpm --filter @cfxdevkit/cas-backend test

# Incorrect (will fail if Moon project ID doesn't exist)
moon run cas-backend:test
```

### Biome import ordering
Biome enforces import ordering. After adding new imports, run:
```bash
pnpm exec biome check --write <file>
```
or lint the whole package:
```bash
pnpm --filter @cfxdevkit/cas-backend lint
```

### Quality gate file-length violation
The quality gate scanner flags any source file exceeding ≈300 lines as a hard violation. Fix by splitting the file into focused modules. For test files, split by test concern (e.g., `app.auth.test.ts`, `app.jobs.test.ts`, `app.admin.test.ts`) and extract shared helpers into a `*.test-helpers.ts` file.

### TypeScript `unknown` type guards
When a function accepts `unknown` and performs numeric comparisons, add an explicit type guard:
```typescript
// Wrong — TS18046
if (value >= 0) { ... }

// Correct
if (typeof value === 'number' && value >= 0) { ... }
```

---

## Repository Layout for OpenSpec

```
openspec/
  config.yaml                    # schema: spec-driven
  changes/
    <change-name>/
      .openspec.yaml             # schema + created date
      proposal.md                # artifact 1: why/what
      design.md                  # artifact 2: how
      specs/
        <capability>.md          # artifact 3: one per capability
      tasks.md                   # artifact 4: implementation checklist
    archive/
      YYYY-MM-DD-<change-name>/  # completed changes
```

Spec files under `openspec/specs/` (at the top level, not inside a change) are long-lived capability documents that get updated when changes are archived. Delta specs inside a change directory are merged into the main specs on archive.
