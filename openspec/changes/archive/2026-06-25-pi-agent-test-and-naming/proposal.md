## Why

The pi-agent test suite is currently failing because the model policies configuration is missing the required `approvalMode` field, and structural linting checks are flagging non-kebab-case filenames in the commands directory. This change is needed now to unblock CI/CD pipelines, ensure configuration consistency, and align the implementation with established project conventions.

## What Changes

- Add `approvalMode: defer` to the pi-agent model policies configuration to satisfy test expectations.
- Rename `repo*.ts` files in `pi-agent/src/commands` to kebab-case naming to resolve structural linting warnings.

## Capabilities

### New Capabilities
- `pi-agent-test-and-naming`: Aligns pi-agent configuration with test expectations and enforces kebab-case naming conventions for command files.

### Modified Capabilities
- None

## Impact

- Affects `pi-agent` configuration files and test suites.
- Modifies file structure in `pi-agent/src/commands`.
- No changes to external APIs, dependencies, or runtime behavior.
