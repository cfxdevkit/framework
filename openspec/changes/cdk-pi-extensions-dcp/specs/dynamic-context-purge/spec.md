# dynamic-context-purge Specification

## Purpose

Integrate `npm:@davecodes/pi-dcp` (Dynamic Context Pruning) to automatically reduce LLM token spend in long sessions through deduplication of redundant tool results, purging of errored payloads, and an LLM-callable compression tool for summarizing closed work streams.

## Requirements

Requirement: `npm:@davecodes/pi-dcp` SHALL be installed and listed in `.pi/settings.json` packages array

#### Scenario: DCP package is registered
- **WHEN** `.pi/settings.json` is read
- **THEN** the `packages` array SHALL include `"npm:@davecodes/pi-dcp"`

---

Requirement: The DCP `compress` tool SHALL be available to the LLM on session start

#### Scenario: Compress tool is registered
- **WHEN** a Pi session starts
- **THEN** the `compress` tool SHALL be listed in available tools and callable by the LLM

---

Requirement: DCP auto-deduplication SHALL replace duplicate tool results with markers

#### Scenario: Duplicate tool results are pruned
- **WHEN** the same `toolName + canonical(args)` appears multiple times in the session
- **THEN** older copies SHALL be replaced with a `[pruned by pi-dcp: duplicate ... call]` marker on the outbound LLM request

---

Requirement: DCP errored input purge SHALL strip failed tool call arguments after N turns

#### Scenario: Errored inputs are purged
- **WHEN** a tool call has errored and the configured number of turns have passed
- **THEN** the tool call arguments SHALL be stripped from the outbound request while preserving the error message

---

Requirement: Project-level DCP configuration overrides at `.pi/dcp.json` SHALL be honored

#### Scenario: Project-level config overrides DCP defaults
- **WHEN** `.pi/dcp.json` exists in the repository root
- **THEN** DCP SHALL shallow-merge these overrides on top of its default configuration

---

Requirement: DCP slash commands SHALL be available in interactive Pi mode

#### Scenario: Slash commands work
- **WHEN** the user types `/dcp` in interactive mode
- **THEN** the DCP command handler SHALL respond with available subcommands (context, stats, sweep, manual, decompress)

---

Requirement: DCP shall never prune the `compress`, `write`, `edit`, `todo`, `task`, or `skill` tools

#### Scenario: Protected tools are never pruned
- **WHEN** any pruning strategy evaluates protected tools
- **THEN** those tools SHALL be excluded from deduplication and error purge regardless of configuration
