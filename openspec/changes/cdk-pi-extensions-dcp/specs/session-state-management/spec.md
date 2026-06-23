# session-state-management Specification

## Purpose

Provide session state management that survives restarts and turn boundaries, including git dirty-repo guards, automatic checkpoint stashing, and cross-turn state persistence for workflow continuity.

## Requirements

Requirement: The session state extension SHALL guard against session switches with uncommitted git changes

#### Scenario: Dirty repo prompts before session switch
- **WHEN** a user attempts to switch sessions or create a new session with uncommitted changes
- **THEN** Pi SHALL run `git status --porcelain` and prompt the user via `ctx.ui.select()` to commit changes first or proceed anyway

---

Requirement: The session state extension SHALL guard against session forks with uncommitted changes

#### Scenario: Dirty repo prompts before fork
- **WHEN** a user attempts to fork the session with uncommitted changes
- **THEN** Pi SHALL prompt the user via `ctx.ui.select()` to commit changes first or proceed anyway

---

Requirement: The session state extension SHALL auto-stash changes on turn boundary

#### Scenario: Auto-checkpoint on turn boundary
- **WHEN** a user sends a new message after the agent responds
- **THEN** any uncommitted git changes SHALL be auto-stashed before the agent processes the request

---

Requirement: The session state extension SHALL restore stashed changes on session shutdown

#### Scenario: Checkpoint cleanup on shutdown
- **WHEN** a Pi session shuts down
- **THEN** any stashed changes from the checkpoint mechanism SHALL be restored

---

Requirement: Session state SHALL persist across turns and restarts

#### Scenario: State survives restart
- **WHEN** Pi restarts mid-session
- **THEN** session state (git checkpoint info, dirty detection status) SHALL be restored from persisted storage using `pi.appendEntry()` and `pi.getEntries()`

---

Requirement: The GitNexus skill SHALL be available for impact analysis and codebase exploration

#### Scenario: GitNexus skill loads
- **WHEN** a session starts
- **THEN** the `gitnexus` skill at `.pi/skills/gitnexus/SKILL.md` SHALL be loaded and available

---

Requirement: The GitNexus skill SHALL include guidance for blast radius analysis

#### Scenario: Impact analysis guidance
- **WHEN** the user asks about how a symbol is used or what breaks if it changes
- **THEN** the skill SHALL instruct the LLM to run `impact({target: "symbolName", direction: "upstream"})` and report blast radius

---

Requirement: The GitNexus skill SHALL include guidance for context lookup

#### Scenario: Context lookup guidance
- **WHEN** the user needs full context on a specific symbol
- **THEN** the skill SHALL instruct the LLM to use `context({name: "symbolName"})` for callers, callees, and execution flows

---

Requirement: The framework-check skill SHALL be available for changeset validation

#### Scenario: Framework check skill loads
- **WHEN** a session starts
- **THEN** the `framework-check` skill at `.pi/skills/framework-check/SKILL.md` SHALL be loaded and available

---

Requirement: The framework-check skill SHALL include guidance for changeset validation

#### Scenario: Changeset validation guidance
- **WHEN** the user is about to commit or merge changes
- **THEN** the skill SHALL instruct the LLM to run `detect_changes()` to verify changes only affect expected symbols and execution flows
