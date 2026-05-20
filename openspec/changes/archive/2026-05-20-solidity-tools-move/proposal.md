## Why

`repos/cfx-solidity/` contains four packages with two very different roles:

- **Runtime Tier 0** (published, no build-time deps): `@cfxdevkit/contracts`, `@cfxdevkit/abis`
- **Build tools Tier 1** (developer tooling, Hardhat dependency): `@cfxdevkit/compiler`, `@cfxdevkit/codegen-contracts`

Keeping Hardhat and `solc` in the same repo as the runtime contract bindings blurs the tier boundary. `@cfxdevkit/compiler` is consumed by `devnode-server` and `mcp-server` as a dev-time tool; it should live alongside other Tier 1 developer tools in `cfx-tools`. `@cfxdevkit/codegen-contracts` (private, `0.0.0`) is already effectively a build script — it belongs in cfx-tools as well.

## What Changes

- `@cfxdevkit/compiler` moved from `repos/cfx-solidity/packages/compiler/` → `repos/cfx-tools/packages/compiler/`
- `@cfxdevkit/codegen-contracts` moved from `repos/cfx-solidity/packages/contracts-extract/` → `repos/cfx-tools/packages/codegen-contracts/`
- `repos/cfx-solidity/` retains only `contracts/` and `abis/` (Tier 0 runtime)
- `.moon/workspace.yml` — update compiler + contracts-extract project paths
- `repos/cfx-meta/packages/arch-rules/arch-rules.yaml` — compiler moves from cfx-solidity to cfx-tools allowlist
- Consumer deps (`devnode-server`, `mcp-server`) package.json unchanged — `workspace:^` continues to resolve via the workspace protocol regardless of physical path

## Capabilities

### New Capabilities
- `solidity-build-tools-in-cfx-tools`: Hardhat-based compilation tooling (`@cfxdevkit/compiler`, `@cfxdevkit/codegen-contracts`) lives in `cfx-tools/packages/` alongside other Tier 1 developer tools, leaving `cfx-solidity` as a pure runtime package repo.

### Modified Capabilities

## Impact

- `repos/cfx-solidity/packages/compiler/` — removed (moved to cfx-tools)
- `repos/cfx-solidity/packages/contracts-extract/` — removed (moved to cfx-tools)
- `repos/cfx-tools/packages/compiler/` — created
- `repos/cfx-tools/packages/codegen-contracts/` — created
- `.moon/workspace.yml` — update 2 project paths
- `repos/cfx-meta/packages/arch-rules/arch-rules.yaml` — update tier assignments
- No consumer code changes needed
