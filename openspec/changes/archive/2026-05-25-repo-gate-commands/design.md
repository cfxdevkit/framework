## Context

`cdk repo precommit` runs all quality gates in sequence. When one fails, the developer
wants to iterate on just that gate. Today there is no way to do `cdk repo test` or
`cdk repo lint` — they have to run `pnpm exec moon run :test` directly, which bypasses
the precommit output formatting and requires knowing the Moon target names.

`cdk repo check <target>` exists but covers different concerns (arch rules, docs,
secrets scanning) and is confusingly named alongside `precommit`.

## Goals / Non-Goals

**Goals:**
- `cdk repo gate lint` reruns the lint gate with identical output format as precommit
- `cdk repo gate --list` shows available gate names
- Help text clearly separates "quality gates" (`gate` / `precommit`) from "structural checks" (`check`)
- Agent can discover the full command surface via `cdk repo --help` instead of relying on hardcoded knowledge

**Non-Goals:**
- Renaming or removing `cdk repo check` (existing users rely on it)
- Changing what each gate does

## Decisions

**New `gate` subcommand, not aliases.** Adding `cdk repo lint` and `cdk repo test` as
top-level subcommands would pollute the namespace. A single `cdk repo gate <name>` keeps
the surface clean and is consistent with `cdk repo check <target>`.

**Reuse `runRepoCommand` with quality gate targets.** The Moon target names for quality
gates (`lint`, `test`, `typecheck`, `build`, `format`, `gitnexus-analyze`) already exist.
`cdk repo gate` just calls `runRepoCommand(name)` with the same formatting as precommit.

**AGENTS.md discovery rule.** Replace the hardcoded command table with:
> "Run `cdk --help` or `cdk repo --help` to discover available commands. Do not assume
> commands exist — check help first."

## Risks / Trade-offs

- Minimal: new subcommand, no existing behaviour changes.
