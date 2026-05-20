# solidity-build-tools-in-cfx-tools Specification

## Purpose
TBD - created by archiving change solidity-tools-move. Update Purpose after archive.
## Requirements
### Requirement: @cfxdevkit/compiler and @cfxdevkit/codegen-contracts SHALL reside under repos/cfx-tools/packages/
The Solidity build-time packages SHALL have their source directories under `repos/cfx-tools/packages/` and SHALL NOT exist under `repos/cfx-solidity/`.

#### Scenario: compiler package path resolves under cfx-tools
- **WHEN** `pnpm ls --json` is run from the workspace root
- **THEN** `@cfxdevkit/compiler` SHALL report a path under `repos/cfx-tools/packages/compiler`

#### Scenario: cfx-solidity contains only runtime packages after the move
- **WHEN** the contents of `repos/cfx-solidity/packages/` are listed
- **THEN** only `abis/` and `contracts/` SHALL be present

### Requirement: arch-rules SHALL classify compiler as Tier 1 (platform) not Tier 0 (framework)
The `arch-rules.yaml` SHALL assign `@cfxdevkit/compiler` and `@cfxdevkit/codegen-contracts` to the `platform` tier.

#### Scenario: arch-check reports no tier violation for compiler importing Tier 1 packages
- **WHEN** `pnpm check:arch` is run after the move
- **THEN** no tier-violation errors SHALL be reported for `@cfxdevkit/compiler`

### Requirement: Consumer imports of @cfxdevkit/compiler SHALL require no code changes
Packages that depend on `@cfxdevkit/compiler` via `workspace:^` SHALL continue to resolve correctly after the physical path change.

#### Scenario: devnode-server build succeeds after compiler move
- **WHEN** `pnpm --filter @cfxdevkit/devnode-server build` is run after the move
- **THEN** the build SHALL succeed with exit code 0

