# CLI System Analysis — All Independent CLIs & Command Dispatchers

## 1. The Root Dispatcher (cdk / tooling-cli)

**Package**: `@cfxdevkit/tooling-cli` (private, `repos/cfx-tools/infra/tooling-cli/`)
**Binary**: `cdk`, `cfx-tooling`
**CLI Framework**: **clipanion v4.0.0-rc.4** (Cliptools ecosystem)
**Entry**: `src/bin.ts` → `runCli()`
**Wired from root**: `pnpm run cdk` → `pnpm --filter @cfxdevkit/tooling-cli tooling --`

### Command Architecture

```
cdk <namespace> <command> [args]
```

### 7 Namespaces (registry.ts)

| Namespace | Description | Implementation |
|-----------|-------------|----------------|
| `repo` | Repository validation, generation, maintenance | `repo/namespace.ts` |
| `agent` | Interactive agent runtime & provider orchestration | `agent/namespace.ts` |
| `llm` | LLM model management (mostly deprecated → agent) | `llm/namespace.ts` |
| `docs` | Docs pipeline + LLM enrichment | `docs/namespace.ts` |
| `devnode` | Local Conflux devnode-server control plane | `devnode-namespace.ts` |
| `sign` | Headless signing (file keystore, no devnode-server) | `sign-namespace.ts` |
| `signer` | Manage signing identity (.cfxdevkit/signer.json) | `signer-namespace.ts` |

### Full Command Tree

#### `cdk repo` (12 subcommands)
```
cdk repo build [--json]              — Run Moon build across all packages
cdk repo run <target> [args] [--json] — Run any repo command with structured output
cdk repo gate <name> [--json]         — Quality gate (lint|test|typecheck|build|format|gitnexus-analyze)
cdk repo check <sub> [--json]         — Structural checks (validation|hotspots|kebab-groups|unit-configs|docs|ci|secrets|corpus|eval)
cdk repo arch-check [--json]          — Full repo architecture + docs contract check
cdk repo generate <sub> [--json]      — Deterministic generators (all|api|readme|structure|unit-configs)
cdk repo merge [--base] [--dry-run] [--json] [branch...] — Deterministic PR merge
cdk repo units [list\|show]           — List session presets and agent-config overlays
cdk repo review                       — Review changes through active agent workflow
cdk repo [--scope] precommit [args]   — Precommit quality gates (format→lint→typecheck→test→build→repo-check)
cdk repo commit [args]               — Hardened repo commit workflow
cdk repo --scope <preset>            — Scope flag for any command
```

#### `cdk agent` (13 subcommands)
```
cdk agent smoke [args]               — Agent smoke test
cdk agent check [args]               — Agent check
cdk agent merge [--base] [--dry-run] [--json] — Deterministic agent merge
cdk agent endpoints                  — Print agent endpoints
cdk agent config <sub>               — Agent config management
cdk agent modes                      — Print available modes
cdk agent status                     — Print agent status
cdk agent chat [--override] [prompt] — Interactive PI session
cdk agent commit [prompt]            — PI commit session
cdk agent rpc [scope]                — PI RPC session
cdk agent print [prompt]             — One-shot PI print
cdk agent deterministic <workflow>   — Deterministic LLM workflows (models, validate-models, precommit, docs-api, docs-api-probe, readme-upkeep, package-pages, structure-upkeep, wiki-generate)
cdk agent exploratory all            — Exploratory LLM workflows
cdk agent providers                  — Print providers strategy
```

#### `cdk llm` (20+ commands, mostly deprecated → agent)
```
cdk llm models                       — List models (deprecated → agent)
cdk llm model                        — Interactive model picker (deprecated)
cdk llm validate-models              — Probe models (deprecated)
cdk llm config                       — LLM config (deprecated)
cdk llm ask                          — One-shot question (deprecated)
cdk llm actions / action             — Generic LLM actions (deprecated)
cdk llm docs-api / docs-api-probe    — Docs workflows (deprecated)
cdk llm readme-upkeep                — README upkeep (deprecated)
cdk llm package-pages                — Package pages (deprecated)
cdk llm structure-upkeep             — Structure upkeep (deprecated)
cdk llm validation / changeset / release / ci-cd — (deprecated)
```

#### `cdk docs` (6 subcommands + pipeline commands)
```
cdk docs sync all|<pkg>              — Sync docs pipeline (from docs-pipeline package)
cdk docs validate content|structure  — Validate docs (from docs-pipeline)
cdk docs generate [all|api|readme|structure|packages]
cdk docs enrich [all|api|readme|packages|structure] [--model] [--quick] [--force]
cdk docs probe api [--package] [--quick]
cdk docs wiki [generate|sync|validate]
cdk docs review [args]
```

#### `cdk devnode` (3 subcommands)
```
cdk devnode start [--port] [--host] [--keystore-path]
cdk devnode stop [--base-url]
cdk devnode status [--base-url] [--json]
```

#### `cdk sign` (2 subcommands)
```
cdk sign message <text> [--space] [--keystore] [--account] [--json]
cdk sign typed-data <json-file> [--space] [--keystore] [--json]
```

#### `cdk signer` (5 subcommands)
```
cdk signer setup                     — Interactive signer config wizard
cdk signer status [--json]           — Show active signer
cdk signer list [--json]             — List all signers
cdk signer set <key> <value>         — Set config value
cdk signer use <name>                — Switch default signer
```

### Global Commands (on any namespace)
```
cdk help                             — Show help
cdk catalog                          — Print tooling command catalog as JSON
```

---

## 2. Independent CLI Packages (published binaries)

### `@cfxdevkit/cli` (public)
**Path**: `repos/cfx-tools/packages/cli/`
**Binary**: `cfx`
**CLI Framework**: **Custom** (manual arg parsing, no library)
**Purpose**: Developer CLI for blockchain operations

| Command | Description |
|---------|-------------|
| `cfx status [--chain <id>]` | Ping chain, show head block + latency |
| `cfx derive [--mnemonic] [--generate] [--count N]` | Derive dual-space accounts (EVM + Core) |
| `cfx generate [--strength]` | Generate BIP-39 mnemonic |
| `cfx contracts extract <dir>` | Extract ABIs from Hardhat artifacts |

**Source**: `src/bin.ts` → `run()` → commands in `src/commands/`

### `@cfxdevkit/devnode` (public)
**Path**: `repos/cfx-core/packages/devnode/`
**Binary**: `cfxdevkit-devnode`
**CLI Framework**: **Custom** (manual arg parsing)
**Purpose**: Local Conflux dev node lifecycle

| Flag | Description |
|------|-------------|
| `--core-port <n>` | Core Space RPC port |
| `--espace-port <n>` | eSpace RPC port |
| `--accounts <n>` | Number of funded accounts |
| `--balance <n>` | Balance per account |
| `--no-mining` | Disable auto-miner |

**Source**: `src/cli.ts` → `createDevNode()`

### `@cfxdevkit/devnode-server` (public)
**Path**: `repos/cfx-tools/packages/devnode-server/`
**Binary**: `cfxdevkit-devnode-server`
**Framework**: **Hono** (HTTP framework)
**Purpose**: Control plane for local dev node (keystore management, signing proxy)

| Subcommand | Description |
|------------|-------------|
| `serve` | Start the Hono server |

**Source**: `src/cli.ts`

### `@cfxdevkit/mcp-server` (public)
**Path**: `repos/cfx-tools/packages/mcp-server/`
**Binary**: `cfxdevkit-mcp`
**Framework**: **MCP SDK** (Model Context Protocol)
**Purpose**: Expose devkit tools to AI agents

**Source**: `src/bin/server.ts`

### `@cfxdevkit/docs-pipeline` (private)
**Path**: `repos/cfx-tools/packages/docs-pipeline/`
**Binary**: `cfx-docs-pipeline`
**Purpose**: Documentation generation, validation, wiki sync

### `@cfxdevkit/codegen-contracts` (private)
**Path**: `repos/cfx-tools/packages/codegen-contracts/`
**Binary**: `cfxdevkit-extract-contracts`
**Purpose**: Extract ABI + bytecode from Hardhat artifacts → TypeScript modules

### `@cfxdevkit/cdk-repo-check` (private)
**Path**: `repos/cfx-tools/packages/cdk-repo-check/`
**Binary**: None (library only)
**Purpose**: Deterministic repo checks and policy reports (used by tooling-cli)

### `@cfxdevkit/arch-check` (private)
**Path**: `repos/cfx-tools/packages/arch-check/`
**Binary**: None (library only, called via tsx)
**Purpose**: Architecture + docs contract checks (called via moon tasks and tooling-cli)

### `@cfxdevkit/workspace-utils` (dependency)
**Path**: `repos/cfx-tools/packages/workspace-utils/` (shared lib)
**Purpose**: Workspace root detection, path resolution (shared across CLIs)

---

## 3. DevKit Workspace CLIs (separate git repo)

**Path**: `.cfxdevkit/devkit-workspace/` (independent git repo)

### `@cfxdevkit/scaffold-cli` (public)
**Binary**: `scaffold-cli`
**Framework**: **Custom** (Node fs/path + @inquirer/prompts)
**Purpose**: Project scaffolding from templates + targets

| Command | Description |
|---------|-------------|
| `scaffold-cli new <dir>` | Interactive scaffold |
| `scaffold-cli new <dir> --template <name>` | CLI scaffold |
| `scaffold-cli create <dir> --template <name>` | Create alias |
| `scaffold-cli list-templates` | List templates |
| `scaffold-cli list-targets` | List targets |

**Templates**: `minimal-dapp`, `project-example`, `wallet-probe`
**Targets**: `devcontainer`, `code-server`

### `devkit-backend` (private)
**Binary**: `devkit-backend`
**Purpose**: Backend service for devkit workspace

### `devkit-mcp` (private)
**Binary**: `devkit-mcp`
**Purpose**: MCP server for devkit workspace

---

## 4. Project-Level CLIs

### `@cfxdevkit/cas-setup` (private)
**Path**: `projects/cas/packages/setup/`
**Binary**: `cas-setup`
**Purpose**: Interactive CAS instance setup wizard

---

## 5. Moon Task Wrappers (entry point layer)

Moon is the **task runner** but also wraps CLI commands. The root `package.json` scripts show the wiring:

```json
"scripts": {
  "build":   "moon run :build --concurrency 3",
  "test":    "moon run :test --concurrency 1",
  "lint":    "moon run :lint --concurrency 4",
  "typecheck":"moon run :typecheck --concurrency 4",
  "check":   "moon run :check",
  "clean":   "moon run :clean",
  "cdk":     "pnpm run tooling --",
  "repo":    "pnpm run cdk -- repo",
  "repo:merge":"pnpm run cdk -- repo merge",
  "repo:build":"pnpm run cdk -- repo build",
  "repo:check":"pnpm run cdk -- repo check",
  "agent":   "pnpm run cdk -- agent",
  "llm":     "pnpm run agent",
  "llm:ask": "pnpm run cdk -- agent print --"
}
```

### Moon Tasks that invoke the tooling CLI

Several `moon.yml` files define tasks that call `cdk` subcommands:
- `generate-api`, `generate-readme`, `generate-structure` — call arch-check generators via tsx
- `check-hotspots`, `check-kebab-groups`, `check-report` — call arch-check via tsx
- `check-secrets` — call arch-check via tsx

**These are currently direct `tsx` invocations, NOT going through moon as a unified entrypoint.**

---

## 6. Moon Task Definitions (per-package)

### Library packages (`moon.yml` — from `@cfxdevkit/moon-config`)
```yaml
type: 'library'
language: 'typescript'
platform: 'node'
```

### Application packages (e.g., vscode-extension)
```yaml
type: 'application'
language: 'typescript'
tasks:
  build:
    command: 'tsc -p tsconfig.json'
    inputs: ['@group(sources)', '@group(configs)']
    outputs: ['dist']
    options:
      mergeArgs: 'replace'
      cache: true
```

### Key moon task patterns
- **Cross-package deps**: `cdk repo build` depends on `client:build`, `compiler:build`, `cdk:build`, `scaffold-cli:build`, `signer-session:build`
- **`:build`, `:lint`, `:test`, `:typecheck`, `:check`, `:clean`** — universal moon tasks
- **`arch-check:*`** — architecture validation tasks (call tsx directly, not moon as entry)

---

## 7. Current Problems & Consolidation Opportunities

### Problem 1: Three entry points for repo operations
```
pnpm run repo          → cdk repo (clipanion dispatcher)
pnpm run check         → moon run :check (moon task runner)
pnpm run tooling --    → cdk repo (via pnpm filter)
```

### Problem 2: Independent CLIs not unified
| CLI | Purpose | Entry |
|-----|---------|-------|
| `cdk` | Main dispatcher | pnpm script → tooling-cli |
| `cfx` | Blockchain dev ops | npm bin |
| `cfxdevkit-devnode` | Node lifecycle | npm bin |
| `cfxdevkit-devnode-server` | Dev node control | npm bin |
| `cfxdevkit-mcp` | AI agent tools | npm bin |
| `cfx-docs-pipeline` | Docs pipeline | npm bin |
| `cfxdevkit-extract-contracts` | Codegen | npm bin |
| `scaffold-cli` | Project scaffolding | npm bin |
| `cas-setup` | CAS setup | npm bin |

**All 9 binaries are independent — no single command orchestrates them.**

### Problem 3: Arch-check CLI called via tsx, not moon
```
moon.yml: "tsx src/bin/check-hotspots.ts --fail-on-hard"
```
This bypasses moon as the task entry point — should be `moon run :check-hotspots`.

### Problem 4: LLM namespace deprecated but still present
20+ hidden commands in `cdk llm` that redirect to `cdk agent`. These should be removed.

---

## 8. Recommended Consolidation Architecture

```
                    ┌─────────────────────────────────────────┐
                    │          moon (task runner)             │
                    │  :build  :test  :lint  :typecheck       │
                    │  :check  :clean  :format  :generate     │
                    └──────┬──────────────────────┬───────────┘
                           │                      │
              ┌────────────▼──────┐   ┌───────────▼────────────┐
              │ cdk repo          │   │ cdk agent / docs / llm │
              │ build, run, gate  │   │ (PI orchestrator)      │
              │ check, merge,     │   │                          │
              │ generate, commit  │   │                          │
              └───────────────────┘   └────────────────────────┘
                           │
              ┌────────────▼────────────────────────────────────┐
              │         moon run :cdk (unified entry)           │
              │                                                   │
              │  cdk repo build   → moon run :build              │
              │  cdk repo gate    → moon run :gate:lint          │
              │  cdk repo check   → moon run :check              │
              │  cdk repo generate → moon run :generate          │
              │  cdk repo merge   → moon run :merge              │
              │  cdk agent chat   → PI session                   │
              └─────────────────────────────────────────────────┘
```

### Phase 1: Moon as single entry point for all repo operations
1. **Create `:cdk` moon task** that delegates to `cdk repo` commands
2. **Convert all arch-check tsx calls** to proper moon tasks with inputs/outputs
3. **Add moon tasks for independent CLIs**:
   - `:devnode-start`, `:devnode-stop` → `cfxdevkit-devnode-server serve`
   - `:scaffold` → `scaffold-cli new`
   - `:extract-contracts` → `cfxdevkit-extract-contracts`
   - `:docs-sync` → `cfx-docs-pipeline sync`

### Phase 2: Unified `cdk` dispatcher
1. **Remove deprecated `cdk llm` commands** (already hidden)
2. **Make moon tasks callable from cdk**: `cdk build` → runs `moon run :build`
3. **Standardize all 9 CLIs** under `cdk` namespace or as subcommands

### Phase 3: Project-independent moon workspace
1. **Moon workspace.yml** declares all 30+ projects — already done
2. **Task graph** is already deterministic and parallel — already working
3. **Remove direct tsx invocations** from moon.yml — replace with task definitions

---

## 9. Summary Table: All CLIs

| # | Binary | Package | Location | Framework | Scope |
|---|--------|---------|----------|-----------|-------|
| 1 | `cdk` / `cfx-tooling` | tooling-cli | `infra/tooling-cli/` | clipanion | **All repo ops** |
| 2 | `cfx` | cli | `packages/cli/` | Custom (manual) | Blockchain dev ops |
| 3 | `cfxdevkit-devnode` | devnode | `cfx-core/packages/devnode/` | Custom (manual) | Node lifecycle |
| 4 | `cfxdevkit-devnode-server` | devnode-server | `packages/devnode-server/` | Hono | Node control plane |
| 5 | `cfxdevkit-mcp` | mcp-server | `packages/mcp-server/` | MCP SDK | AI agent tools |
| 6 | `cfx-docs-pipeline` | docs-pipeline | `packages/docs-pipeline/` | Custom | Docs pipeline |
| 7 | `cfxdevkit-extract-contracts` | codegen-contracts | `packages/codegen-contracts/` | Custom | Contract codegen |
| 8 | `scaffold-cli` | scaffold-cli | `devkit-workspace/` | Custom (inquirer) | Project scaffolding |
| 9 | `devkit-backend` | devkit-backend | `devkit-workspace/` | Custom | Backend service |
| 10 | `devkit-mcp` | mcp-server | `devkit-workspace/` | Custom | MCP server |
| 11 | `cas-setup` | cas-setup | `projects/cas/packages/setup/` | Custom | CAS setup |

**Total: 11 independent CLI binaries across 3 git repos**

---

*Generated: 2026-06-19*
