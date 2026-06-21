## Why

The `pi-agent` module is currently failing CI due to snapshot mismatches in test expectations for `approvalMode` and `modelPolicies`. Additionally, five `repo*.ts` command files in `pi-agent/src/commands/` violate the kebab-case naming convention, triggering warnings and causing downstream check failures in `showcase-public:test`. This change is needed now to unblock the CI pipeline, reduce technical debt, and enforce consistent file structure standards across the repository.

## What Changes

- Update `pi-agent` test snapshots to align with the expected `approvalMode: "defer"` and `modelPolicies` configuration.
- Consolidate and rename five `repo*.ts` command files in `pi-agent/src/commands/` to follow kebab-case conventions (`repo-actions.ts`, `repo-check.ts`, `repo-commit.ts`, `repo-run.ts`, `repo-status.ts`).
- Resolve the cached signal diff in `showcase-public:test` by ensuring the underlying `pi-agent:test` outputs match expectations.

## Capabilities

### New Capabilities
- `pi-agent-test-and-kebab-remediation`: Aligns test snapshots for pi-agent approval and policy configurations, and enforces kebab-case command file grouping in the pi-agent module.

### Modified Capabilities
- None

## Impact

- Directly modifies test snapshot files and command file structure within `pi-agent/src/commands/`.
- Unblocks CI pipelines (`pnpm run test`, `pnpm run check`) by resolving snapshot mismatches and naming convention warnings.
- No changes to public APIs, external dependencies, or runtime behavior.
