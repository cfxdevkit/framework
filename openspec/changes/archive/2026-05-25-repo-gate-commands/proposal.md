## Why

`cdk repo check <target>` runs arch/docs/secrets/hotspot checks — NOT the quality gates
(lint, test, typecheck, build). The name "check" implies it checks things generically, but
it runs a completely different pipeline than `cdk repo precommit`. This confuses:
- Agents that think `check lint` would lint-check the repo (it doesn't — lint is a gate, not a check target)
- Humans who want to re-run a single failing gate without re-running all of precommit

Additionally, the agent currently has these commands hardcoded in AGENTS.md / skills.
Better: expose a clean `--help` surface and let the agent discover commands from that.

## What Changes

- Add `cdk repo gate <name>` subcommand that runs exactly one quality gate by name:
  `lint | test | typecheck | build | format | gitnexus-analyze`
  This directly reruns the corresponding Moon target for that gate.
- Add `cdk repo gate --list` to enumerate available gate names with their Moon targets.
- Keep `cdk repo check <target>` for the existing arch/docs/secrets targets — but rename
  internally to make the distinction clear. Update help text to say "structural checks"
  vs "quality gates".
- Update `cdk repo --help` to surface both groups clearly.
- Replace hardcoded command knowledge in AGENTS.md with a single rule:
  "discover available commands via `cdk repo --help` or `cdk --help`".

## Capabilities

### New Capabilities
- `repo-gate-run`: `cdk repo gate <name>` — run one quality gate by name

### Modified Capabilities
- `repo-help`: updated `--help` output distinguishes "quality gates" from "structural checks"

## Impact

- `tooling-cli/src/repo-namespace.ts` — add `gate` subcommand handler
- `tooling-cli/src/repo-namespace.ts` — update help text for `check` to say "structural checks"
- `AGENTS.md` — replace hardcoded command list with "discover via --help" rule
- `openspec-apply-change/SKILL.md` — same
