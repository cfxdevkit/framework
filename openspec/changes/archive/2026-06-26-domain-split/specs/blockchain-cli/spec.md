# Capability: blockchain-cli

## Requirements

### REQ-1: Blockchain CLI Package

The `@cfxdevkit/cli` package MUST own ALL blockchain CLI commands. It MUST provide:

**Existing commands (unchanged):**
- `cfx status [--chain <id>] [--rpc <url>]` — ping chain status
- `cfx derive [--mnemonic <m>|--generate] [--count N]` — derive accounts
- `cfx generate [--strength 128|256]` — generate mnemonics
- `cfx contracts extract [--artifacts <dir>] [--out <dir>]` — extract ABIs

**New commands (moved from tooling-cli):**
- `cfx chain list` — list known chain configurations
- `cfx chain show <id>` — show a chain config by id
- `cfx chain resolve <alias>` — resolve common aliases
- `cfx address validate <address>` — validate an address
- `cfx address convert <address> <encoding>` — convert address encoding
- `cfx address normalize <address>` — normalize core-space address
- `cfx keystore status` — show active keystore status
- `cfx keystore list` — list configured signers
- `cfx keystore use <name>` — set default signer
- `cfx keystore status <name>` — show specific keystore status
- `cfx units parse <value> <unit>` — parse decimal value to drip-scaled integer
- `cfx units format <value> [unit]` — format drip-scaled integer to display units

### REQ-2: Blockchain CLI Dependencies

`@cfxdevkit/cli` MUST depend on:
- `@cfxdevkit/cdk` — blockchain core library
- `@cfxdevkit/services` — keystore backends
- `@cfxdevkit/signer-session` — signer operations
- `@cfxdevkit/devnode-server` — devnode operations (optional, for devnode commands)
- `@cfxdevkit/codegen-contracts` — already present

### REQ-3: Blockchain CLI Binary

`@cfxdevkit/cli` MUST export the `cfx` binary. The binary MUST support:
- `cfx <command>` — main command entry
- `cfx <command> --help` — help text
- `cfx <command> --json` — machine-readable output (existing)

### REQ-4: Blockchain CLI Moon Tasks

Moon tasks for blockchain operations MUST remain in `tooling-cli/moon.yml` as orchestrators:
- `devnode-start` → `@cfxdevkit/devnode start`
- `devnode-stop` → `@cfxdevkit/devnode stop`
- `devnode-status` → `@cfxdevkit/devnode status`
- `devnode-serve` → `@cfxdevkit/devnode-server serve`
- `signer-setup` → `@cfxdevkit/signer-session setup`
- `signer-status` → `@cfxdevkit/signer-session status`
- `signer-list` → `@cfxdevkit/signer-session list`
- `signer-set` → `@cfxdevkit/signer-session set`
- `signer-use` → `@cfxdevkit/signer-session use`
- `sign-message` → `@cfxdevkit/signer-session message`
- `sign-typed-data` → `@cfxdevkit/signer-session typed-data`

Moon tasks are orchestrators, not duplicate CLI. They call binaries directly.

## Non-Requirements

- Blockchain CLI MUST NOT import from `@cfxdevkit/cdk-repo-check` (repo mgmt)
- Blockchain CLI MUST NOT import from `@cfxdevkit/llm-agents` (LLM workflows)
- Moon tasks MUST NOT be moved into `@cfxdevkit/cli` (they're moon orchestrators)
