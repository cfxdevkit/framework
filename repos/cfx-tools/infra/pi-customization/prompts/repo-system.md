# Conflux DevKit — Repository System Instruction

You are operating inside the **Conflux DevKit** monorepo (`@cfxdevkit/framework`), a
Conflux-focused framework with platform, domain, and project layers.

---

## 1. Repository Control Plane

- **`repo`** is the control plane for repository management operations.
- **`cfx`** is the control plane for blockchain operations.
- Use repo-local prompts, skills, tooling, and artifacts when available.
- Respect monorepo unit scoping when the active session declares a `--scope`.
- Never bypass the control plane — every structural change flows through it.

---

## 2. Validation & Quality Gates

After any substantive edit, run the following validation sequence **in order**:

```
repo check          # full validation (gitnexus → format → lint → typecheck →
                    #          tests → build → hotspots → kebab-groups → repo check)
```

- Default to `repo check` for repo-level validation.
- Use `repo check hotspots` for hotspots only.
- Use `repo check --quick` for fast-passes when context is limited.

### When `repo check` surfaces error-status steps

1. Report findings to the user.
2. **In non-explore mode**: Ask if they want to auto-remediate with `repo_agent_check`.
   - `repo_agent_check` will create OpenSpec changes (plan → user confirm → apply).
   - The user may choose to fix minor issues manually instead.
3. **In explore mode**: DO NOT auto-remediate. Just report findings.
4. **Never auto-apply changes without user consent.**

### Precommit Gate

Before archiving any OpenSpec change, run the full precommit:

```
repo precommit
```

This runs format → lint → typecheck → **tests** → build → repo-check.
All gates must pass. **Do not archive with failing gates.**

---

## 3. OpenSpec Change Workflow

The repository uses **OpenSpec** as the standard unit of change management.

### Phase 1 — Propose

```
/opsx-propose
```

Generates all artifacts in one step:

- `proposal.md` — what & why
- `design.md` — how
- `tasks.md` — implementation steps (checkbox-based)

The change is created at `openspec/changes/<name>/`.

### Phase 2 — Explore (optional)

```
/opsx-explore
```

A thinking-partner mode for investigating ideas, clarifying requirements, and
refining design before or during implementation. You may read files, search code,
and build diagrams — but **never write application code** in explore mode.
Creating OpenSpec artifacts is fine (capturing thinking).

### Phase 3 — Apply

```
/opsx-apply
```

Implements tasks from the change in order:

1. Reads all context files (proposal, specs, design, tasks).
2. Implements each pending task, marking it complete.
3. Runs `repo precommit` after all tasks.
4. If precommit passes → suggests archive.
5. If precommit fails → surfaces failing gates, offers `repo_agent_check` for
   structural follow-ups, does NOT archive until clean.

### Phase 4 — Archive

```
/opsx-archive
```

Finalizes the change:

1. Runs `repo precommit` — **required** before archive.
2. Checks artifact and task completion.
3. Syncs delta specs to main specs (if any).
4. Moves the change to `openspec/changes/archive/YYYY-MM-DD-<name>/`.

---

## 4. Branch & Merge Flow

**Every OpenSpec change MUST have its own branch and be merged when archived.**

### Creating the Branch

After proposing a change, the branch is created automatically:

```
openspec new change "<name>"
```

This scaffolds the change directory and the branch is tracked via
`openspec/changes/<name>/` metadata.

### Implementation

During `/opsx-apply`:

1. The agent works on the change branch.
2. Commits are made incrementally as tasks complete.
3. Each commit uses `/repo-commit` (TUI-native approval).

### Merging & Archiving

When the change is ready to archive (`/opsx-archive`):

1. All commits on the change branch are squashed into a single commit.
2. The change directory is moved to `openspec/changes/archive/YYYY-MM-DD-<name>/`.
3. The branch is merged into the target branch (`main` or `dev`).
4. The branch is deleted.

**Guardrails:**
- Never archive a change without first confirming `repo precommit` passes.
- Never merge a change that hasn't been archived first.
- Never skip the branch — every change is isolated on its own branch.

---

## 5. GitNexus Code Intelligence

This repository is indexed by **GitNexus**. Use it for impact analysis and
code navigation.

### Always

- **Run impact analysis before editing any symbol.**
  ```
  impact({target: "symbolName", direction: "upstream"})
  ```
- **Run `detect_changes()` before committing.**
- **Warn the user** if impact analysis returns HIGH or CRITICAL risk.

### Never

- Edit a function, class, or method without running `impact` first.
- Ignore HIGH or CRITICAL risk warnings.
- Rename symbols with find-and-replace — use `rename` which understands the call graph.
- Commit changes without running `detect_changes()`.

---

## 6. Operating Modes

The agent operates in two complementary modes:

### Deterministic Mode (default)

- System interaction and validation (checks, docs, structure).
- No code generation — only analysis, reporting, and tooling.
- Used for: `repo check`, `llm-agents deterministic`, `repo_agent_check`.

### Exploratory Mode

- Code generation, refactoring, and broader agent-driven work.
- Used for: `cdk agent exploratory`, `/opsx-apply`, `/opsx-propose`.
- The agent manages all tooling in the repository itself.

Mode selection:
```
llm-agents deterministic config set mode <deterministic|exploratory>
```

---

## 7. Quick Reference

| Command | Purpose |
|---------|---------|
| `llm-agents deterministic` | Run deterministic repo workflow |
| `cdk agent chat --endpoint <url> [prompt]` | Use custom OpenAI-compatible backend |
| `repo check` | Full validation sequence |
| `repo check hotspots` | Hotspots only |
| `repo check --quick` | Fast validation pass |
| `repo precommit` | Full precommit (format → lint → typecheck → tests → build → repo-check) |
| `repo_agent_check` | Auto-create OpenSpec changes for validation failures |
| `/repo-commit [prompt]` | TUI-native commit with approval dialog |
| `/repo-check [--dry-run] [--create-branch] [--quick]` | Run repo validation pipeline |
| `/opsx-propose` | Create new OpenSpec change with all artifacts |
| `/opsx-explore` | Enter thinking-partner explore mode |
| `/opsx-apply` | Implement tasks from an OpenSpec change |
| `/opsx-archive` | Archive a completed change (requires clean precommit) |
