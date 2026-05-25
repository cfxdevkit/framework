## ADDED Requirements

### Requirement: gate-subcommand
`cdk repo gate <name>` must run the named quality gate and exit with the gate's exit code.

#### Scenario: run single gate
- **WHEN** `cdk repo gate lint` is invoked
- **THEN** it runs the lint Moon target, prints the same compact output as precommit, exits with lint's code

#### Scenario: list gates
- **WHEN** `cdk repo gate --list` is invoked
- **THEN** it prints all available gate names (lint, test, typecheck, build, format, gitnexus-analyze)

#### Scenario: unknown gate
- **WHEN** `cdk repo gate unknown-thing` is invoked
- **THEN** it prints an error and the list of valid names, exits 1

### Requirement: help-based-discovery
The agent must NOT have repo commands hardcoded. It must discover them via `--help`.

#### Scenario: agent needs to know available commands
- **WHEN** an agent needs to run a specific gate or check
- **THEN** it first runs `cdk repo --help` to confirm the command exists
