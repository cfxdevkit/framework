## Why

`@cfxdevkit/tooling-cli` (`cdk` binary) mixes two unrelated domains: blockchain operations (chain, keystore, address, units) and repository management (repo check, precommit, LLM workflows). The `cdk repo` namespace was never added, so repo operations have no terminal entry point — they only exist in PI (`/repo-check`, `repo_agent_check`). This makes the system brittle: developers can't run repo validation from the terminal, LLM agents spawn CLI commands that don't exist, and the package has no clear responsibility.

The naming compounds the confusion: `@cfxdevkit/cdk` is the blockchain framework (RPC, contracts), while `cdk-repo-check` is about repo health (unrelated to blockchain). The `cdk` binary prefix implies blockchain for both domains.

This change establishes clean domain boundaries so each package has a single, obvious responsibility.

## What Changes

### Domain 1: Blockchain Framework → `@cfxdevkit/cli` (`cfx` binary)

All blockchain CLI commands move to `@cfxdevkit/cli`:
- `cfx status` — chain status (already exists)
- `cfx derive` — account derivation (already exists)
- `cfx generate` — mnemonic generation (already exists)
- `cfx contracts extract` — ABI extraction (already exists)
- **NEW**: `cfx chain list/show/resolve` — from `cdk chain`
- **NEW**: `cfx address validate/convert/normalize` — from `cdk address`
- **NEW**: `cfx keystore status/list/use` — from `cdk keystore`
- **NEW**: `cfx units parse/format` — from `cdk units`

### Domain 2: Repository Management → `@cfxdevkit/tooling-cli` (`repo` binary)

Repository management commands get a `repo` binary (not `cdk repo`):
- `repo check [target]` — run validation (validation, hotspots, kebab-groups)
- `repo precommit [--force]` — run precommit quality + policy gates
- `repo status` — show provider/model context
- `repo actions [--mode]` — list available actions
- `repo run <action>` — run a specific action
- `repo review` — run review agent
- `repo docs generate/validate` — docs ops (already via `cdk docs`)
- `repo merge` — merge validation

### Pure Libraries (No Change)

These packages are already properly separated:
- `@cfxdevkit/cdk-repo-check` — pure library (callable from anywhere)
- `@cfxdevkit/arch-check` — pure library (callable from anywhere)
- `@cfxdevkit/docs-pipeline` — doc ops (callable from anywhere)
- `@cfxdevkit/llm-agents` — LLM workflows (callable from anywhere)
- `@cfxdevkit/pi-customization` — PI integration (delegates to above)

## Capabilities

### New Capabilities
- `blockchain-cli`: `@cfxdevkit/cli` (`cfx` binary) owns ALL blockchain CLI commands. Extends existing 4 commands with chain/address/keystore/units subcommands extracted from `tooling-cli`.
- `repo-cli`: `@cfxdevkit/tooling-cli` (`repo` binary) owns ALL repository management CLI commands. Provides terminal access to validation, precommit, status, actions, review, and docs ops.
- `domain-separation`: Establishes clear boundaries: blockchain ops → `cfx` binary, repo ops → `repo` binary, pure logic → library packages, PI → delegation layer.

### Modified Capabilities
- `cdk-cli`: Narrows from 7 namespaces (~50 commands) to 0 namespaces. Package `@cfxdevkit/tooling-cli` becomes pure repo management with `repo` binary.
- `moon-entrypoint`: Moon tasks (`pnpm repo:check`, `pnpm devnode-start`, etc.) remain as orchestrators but no longer duplicate CLI namespaces.

## Impact

- **Affected packages**: `@cfxdevkit/tooling-cli` (namespace restructure, binary rename), `@cfxdevkit/cli` (extended with blockchain CLI commands), `@cfxdevkit/llm-agents` (fix exports, remove hardcoded CLI calls)
- **Breaking**: `cdk chain`, `cdk keystore`, `cdk address`, `cdk units` commands removed from `cdk` binary. Migrate to `cfx chain`, `cfx keystore`, `cfx address`, `cfx units`.
- **Breaking**: `cdk` binary renamed to `repo` binary for repo management. `cdk` alias removed.
- **No external API changes**: Library exports unchanged. `moon run` tasks unchanged.
- **Dependencies**: `tooling-cli` removes blockchain deps (`cdk`, `services`, `signer-session`, `devnode-server`). `cli` adds them.
- **PI integration**: `/repo-*` commands unchanged (delegating). `/cdk` commands remain in PI (delegating to `cfx` binary).
