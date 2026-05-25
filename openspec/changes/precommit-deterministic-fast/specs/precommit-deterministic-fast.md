## ADDED Requirements

### Requirement: deterministic-precommit
`cdk repo precommit` must complete without any LLM call.

#### Scenario: precommit with no LLM available
- **WHEN** `LEMONADE_URL` is unset and no cloud provider is configured
- **THEN** `cdk repo precommit` still runs all gates and exits with the correct code

#### Scenario: precommit timing
- **WHEN** all gates pass
- **THEN** total elapsed is within 5% of the sum of individual gate times (no LLM overhead)

### Requirement: compact-failure-output
On gate failure, precommit prints a compact summary: gate name, elapsed, up to 3 signal lines.

#### Scenario: two gates failing
- **WHEN** lint and test both fail
- **THEN** output contains exactly the two failing gate names plus their first signal lines
- **THEN** total output is ≤ 20 lines
- **THEN** process exits with code 1

### Requirement: clean-pass-output
On full pass, precommit prints a single-line confirmation.

#### Scenario: all gates pass
- **WHEN** all quality gates and policy gates pass
- **THEN** output contains `status: passed`
- **THEN** process exits with code 0
