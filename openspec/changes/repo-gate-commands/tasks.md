## P1 — Add `cdk repo gate` subcommand

- [x] **P1.1** In `repo-namespace.ts`: add gate name constants matching `QUALITY_GATE_SPECS` ids:
  `lint | test | typecheck | build | format | gitnexus-analyze`
- [x] **P1.2** Add handler for `command === 'gate'` in the repo namespace dispatcher
- [x] **P1.3** `gate --list` prints available gate names and their Moon targets
- [x] **P1.4** `gate <name>` calls `runRepoCommand(name as RepoCommandTarget, args)` and
  formats output via `renderRepoResult` — same format as other repo commands
- [x] **P1.5** Unknown gate name prints error + available names list, exits 1
- [x] **P1.6** Add `gate` to the commands list in `repoToolingNamespace` so it appears in help

## P2 — Clarify help text

- [x] **P2.1** In `printRepoHelp()`: add a "Quality gates" section listing `precommit` and `gate`
- [x] **P2.2** Rename the "check" section header in help to "Structural checks (arch, docs, secrets)"
  to distinguish it from quality gates
- [x] **P2.3** Add a one-liner to the `check` command description:
  `"Structural checks (arch rules, docs, secrets, hotspots). For lint/test/build, use: gate"`

## P3 — Replace hardcoded command knowledge in agent guidance

- [x] **P3.1** In `AGENTS.md`: replace the hardcoded "use `cdk repo precommit`" section with:
  ```
  - Discover available repo commands: `cdk repo --help`
  - Run all quality gates: `cdk repo precommit`
  - Re-run one failing gate: `cdk repo gate <name>` (run `cdk repo gate --list` for names)
  - LLM-assisted remediation: call repo_agent_check tool
  ```
- [x] **P3.2** In `openspec-apply-change/SKILL.md`: remove any hardcoded `cdk repo check` references;
  replace with "discover gate names via `cdk repo gate --list`"

## Validate

- [x] **V.1** `cdk repo gate lint` runs and exits with lint's actual exit code
- [x] **V.2** `cdk repo gate --list` prints all 6 gate names
- [x] **V.3** `cdk repo gate badname` exits 1 with an error listing valid names
- [x] **V.4** `cdk repo --help` shows "Quality gates" and "Structural checks" as separate sections
- [x] **V.5** `pnpm run typecheck` passes for `tooling-cli`
