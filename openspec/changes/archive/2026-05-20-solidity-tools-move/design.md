## Context

`repos/cfx-solidity/` contains four packages split by responsibility:

| Package | npm name | Published | Role |
|---------|----------|-----------|------|
| `abis/` | `@cfxdevkit/abis` | yes | Zero-dep ABI shapes (Tier 0) |
| `contracts/` | `@cfxdevkit/contracts` | yes | Runtime contract bindings (Tier 0) |
| `compiler/` | `@cfxdevkit/compiler` | yes | Solidity build pipeline — depends on `solc`, `hardhat` (Tier 1 intent) |
| `contracts-extract/` | `@cfxdevkit/codegen-contracts` | no (private, 0.0.0) | ABI extraction CLI — build-time script |

`abis` and `contracts` are pure runtime packages that belong in Tier 0. `compiler` carries `solc` and is a developer tool — it is consumed by `devnode-server` (Tier 1) and `mcp-server` (Tier 1). `codegen-contracts` is a private CLI with no cfxdevkit dependencies. Neither should live in a Tier 0 repo.

The `arch-rules.yaml` currently assigns all of `repos/cfx-solidity/packages/**` to Tier 0 (`framework`). This means `compiler` is structurally misclassified.

## Goals / Non-Goals

**Goals:**
- Move `@cfxdevkit/compiler` → `repos/cfx-tools/packages/compiler/`
- Move `@cfxdevkit/codegen-contracts` → `repos/cfx-tools/packages/codegen-contracts/`
- Update `arch-rules.yaml` so compiler + codegen-contracts are classified as Tier 1
- Leave `@cfxdevkit/abis` and `@cfxdevkit/contracts` in `repos/cfx-solidity/` (Tier 0, unchanged)
- No changes to any package names, versions, or consumer import paths

**Non-Goals:**
- Moving `abis` or `contracts` (they are correctly placed)
- Changing `compiler` API or adding new features
- Renaming `cfx-solidity` to `cfx-contracts` (Phase 2 restructuring)

## Decisions

### D1: Move only build-time packages; runtime stays
`@cfxdevkit/abis` and `@cfxdevkit/contracts` remain in `repos/cfx-solidity/packages/`. The arch-rules path for `repos/cfx-solidity/packages/**` is narrowed to exclude `compiler` and `contracts-extract`.

### D2: Target paths in `repos/cfx-tools/packages/`
`compiler/` → `repos/cfx-tools/packages/compiler/` (keep same directory name)
`contracts-extract/` → `repos/cfx-tools/packages/codegen-contracts/` (rename to match the npm package name)

### D3: `workspace:^` deps resolve by name, not path
`devnode-server` and `mcp-server` already declare `"@cfxdevkit/compiler": "workspace:^"`. After the move, pnpm resolves this by package name — no change to consumer `package.json` files needed.

### D4: arch-rules.yaml split path for cfx-solidity
The `framework` tier path changes from `"repos/cfx-solidity/packages/**"` to two explicit paths: `"repos/cfx-solidity/packages/abis"` and `"repos/cfx-solidity/packages/contracts"`. The `platform` tier gains `"repos/cfx-tools/packages/compiler"` and `"repos/cfx-tools/packages/codegen-contracts"`.

Alternatively use a glob exclusion — but explicit paths are clearer and already the convention for other packages.

## Risks / Trade-offs

- One `arch-check` rule currently flags `compiler` as Tier 0 (if it detects the misclassification); after the move it will be correctly Tier 1 — the check becomes passing rather than failing
- `cfx-solidity/` package.json root (if it has one) may reference `compiler` in workspaces — needs to be updated to remove those references
- `contracts-extract/` has no `moon.yml` — verify or add one after the move
