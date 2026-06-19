# Spec: cdk-cli

The `cdk` binary (from `@cfxdevkit/tooling-cli`) is narrowed to framework-level commands only. All repo-wide operations, LLM operations, and agent sessions move to `moon run`.

## Requirements

### REQ-1: cdk removes repo namespace
The `cdk repo` namespace and all 12 subcommands must be removed from the `cdk` CLI.

- [ ] `cdk repo build` → removed
- [ ] `cdk repo run` → removed
- [ ] `cdk repo gate` → removed
- [ ] `cdk repo check` → removed
- [ ] `cdk repo generate` → removed
- [ ] `cdk repo merge` → removed
- [ ] `cdk repo arch-check` → removed
- [ ] `cdk repo units` → removed
- [ ] `cdk repo review` → removed
- [ ] `cdk repo precommit` → removed
- [ ] `cdk repo commit` → removed
- [ ] `cdk repo run` → removed

### REQ-2: cdk removes agent namespace
The `cdk agent` namespace and all 13 subcommands must be removed from the `cdk` CLI.

- [ ] `cdk agent smoke`, `check`, `merge`, `endpoints`, `config`, `modes`, `status` → removed
- [ ] `cdk agent chat`, `commit`, `rpc`, `print` → removed
- [ ] `cdk agent deterministic:*`, `exploratory:*` → removed

### REQ-3: cdk removes llm namespace entirely
The `cdk llm` namespace must be completely removed from `registry.ts`.

- [ ] All 20+ `cdk llm:*` commands removed
- [ ] `llmToolingNamespace` import removed from `registry.ts`
- [ ] `cdk llm` entry removed from `toolingNamespaces` array

### REQ-4: cdk keeps framework-scoped commands
The following commands must remain in the `cdk` binary:

- [ ] `cdk build [pkg]` — build framework packages
- [ ] `cdk test [pkg]` — test framework packages
- [ ] `cdk lint [pkg]` — lint framework packages
- [ ] `cdk typecheck [pkg]` — typecheck framework packages
- [ ] `cdk check [pkg]` — quality check framework packages
- [ ] `cdk generate [target]` — framework code generation
- [ ] `cdk contracts extract <dir>` — Hardhat artifact extraction
- [ ] `cdk contracts compile [project]` — contract compilation
- [ ] `cdk extract <dir>` — alias for contracts extract
- [ ] `cdk devnode [start|stop|status]` — local dev node
- [ ] `cdk devnode:serve [port] [host]` — control plane
- [ ] `cdk sign message <text> [flags]` — headless signing
- [ ] `cdk sign typed-data <file> [flags]` — typed data signing
- [ ] `cdk signer setup` — signer wizard
- [ ] `cdk signer status [--json]` — show signer
- [ ] `cdk signer list [--json]` — list signers
- [ ] `cdk signer use <name>` — switch signer
- [ ] `cdk mcp start [port]` — MCP server
- [ ] `cdk derive [flags]` — account derivation
- [ ] `cdk generate-mnemonic [--strength]` — mnemonic generation
- [ ] `cdk status [--chain]` — chain status
- [ ] `cdk docs generate [target]` — deterministic docs
- [ ] `cdk docs validate [target]` — docs validation

### REQ-5: cdk package name unchanged
The package `@cfxdevkit/tooling-cli` keeps its current name. Binary remains `cdk`.

- [ ] `package.json` name stays `@cfxdevkit/tooling-cli`
- [ ] Binary `cdk` remains unchanged
- [ ] `cdk-tooling` alias remains unchanged

## Scenarios

### Scenario 1: User runs removed command
**Given** a user runs `cdk repo build`
**When** the command is executed
**Then** the CLI prints `Unknown command: repo. Run 'cdk --help' for usage.`
**And** exits with code 1

### Scenario 2: User runs kept command
**Given** a user runs `cdk build @cfxdevkit/executor`
**When** the command is executed
**Then** the CLI builds the specified framework package
**And** exits with code 0
