# CLI Redesign Analysis — `cdk` (Framework) + `moon` (Repo + LLM Entrypoint)

## Vision

```
┌─────────────────────────────────────────────────────────────────────┐
│                          moon (unified repo entrypoint)             │
│                                                                     │
│  moon run :build           → framework build across all packages     │
│  moon run :lint            → biome lint across all packages          │
│  moon run :test            → vitest across all packages              │
│  moon run :typecheck       → tsc project-references                  │
│  moon run :check           → repo quality gate (all gates)           │
│  moon run :clean           → cleanup dist                            │
│                                                                     │
│  moon run arch-check       → arch rules + docs contract            │
│  moon run repo-merge       → deterministic PR merge                 │
│  moon run repo-generate    → api/readme/structure generators        │
│  moon run repo-commit      → hardened commit workflow               │
│  moon run repo-review      → agent-driven review                    │
│  moon run precommit        → precommit gate chain                   │
│                                                                     │
│  moon run agent:chat       → interactive PI session                 │
│  moon run agent:deterministic:docs-api   → LLM docs enrichment      │
│  moon run agent:exploratory:all            → exploratory LLM ops    │
│  moon run agent:smoke                      → agent smoke test        │
│  moon run agent:merge                      → agent merge             │
│  moon run agent:config                     → agent config            │
│                                                                     │
│  moon run docs:sync    → docs pipeline sync                        │
│  moon run docs:validate → docs validation                          │
│  moon run docs:enrich    → LLM docs enrichment                     │
│  moon run docs:wiki      → wiki operations                         │
│                                                                     │
│  moon run devnode:start  → start dev node + server                 │
│  moon run devnode:stop   → stop dev node + server                  │
│  moon run devnode:status → check dev node + server                  │
│                                                                     │
│  moon run sign:message   → headless message signing                │
│  moon run sign:typed-data → headless typed-data signing            │
│  moon run signer:setup   → signer identity wizard                  │
│                                                                     │
│  moon run contracts:extract → Hardhat artifacts → TypeScript        │
│  moon run scaffold:new     → interactive project scaffold           │
│  moon run scaffold:list    → list templates/targets                 │
│  moon run cdk:build        → cdk CLI build (framework)              │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │ calls
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        cdk (framework CLI)                          │
│                                                                     │
│  cdk <command> [args]                                               │
│                                                                     │
│  cdk build        → build framework packages                       │
│  cdk check        → framework quality check                        │
│  cdk test         → framework unit tests                           │
│  cdk lint         → framework lint                                 │
│  cdk typecheck    → framework typecheck                            │
│  cdk generate     → framework code generation                      │
│  cdk contracts    → Hardhat artifacts → ABIs / TypeScript modules  │
│  cdk devnode      → local dev node (core/espace)                   │
│  cdk devnode:serve → dev node-server control plane                 │
│  cdk sign         → headless signing (file keystore)               │
│  cdk signer       → signing identity management                    │
│  cdk docs         → deterministic docs (no LLM)                    │
│  cdk docs:enrich  → LLM docs enrichment (delegates to moon)        │
│  cdk mcp          → start MCP server for AI agents                 │
│  cdk extract      → ABI/bytecode extraction from contracts         │
│  cdk derive       → derive dual-space accounts (EVM + Core)        │
│  cdk generate-mnemonic → BIP-39 mnemonic generation                │
│  cdk status       → chain status (head block, latency)             │
└─────────────────────────────────────────────────────────────────────┘
```

**Key principle**: `moon` is the **single entrypoint** for everything repo-wide — task orchestration, LLM operations, agent sessions, and cross-package workflows. `cdk` is **narrowly scoped** to framework operations that serve developers directly, without touching repo-level concerns like merges, commits, or PR workflows.

---

## 1. Current State — Problem Analysis

### Problem 1: `cdk` owns too much

| Namespace | Current Responsibility | Should Be |
|-----------|----------------------|-----------|
| `repo` | Build, run, gate, check, merge, generate, commit, review, precommit | **moon tasks** |
| `agent` | Chat, smoke, merge, config, modes, status, rpc, print, deterministic, exploratory | **moon agent tasks** |
| `llm` | Models, validate, config, ask, actions, deprecated workflows | **deprecated — remove** |
| `docs` | Pipeline sync + LLM enrichment | **moon docs tasks** |
| `devnode` | Start/stop/status devnode-server | **moon devnode tasks** |
| `sign` | Headless signing | **moon sign tasks** |
| `signer` | Signer identity management | **moon signer tasks** |

**Result**: `cdk` is a 50-command dispatcher that duplicates what moon already does (task graph, parallelism, caching).

### Problem 2: `cdk` calls moon — backwards wiring

```typescript
// cdk repo build → moon run :build
// cdk repo gate → moon run :lint, :test, :typecheck, :build, :format
```

The command dispatcher calls the task runner. This is backwards — the task runner should be the entrypoint, and the CLI should be the library.

### Problem 3: Three entry points

```bash
pnpm run build         → moon run :build
pnpm run cdk repo build → moon run :build (extra hop)
pnpm run check          → moon run :check
```

### Problem 4: LLM operations scattered

- `cdk agent chat` → PI interactive session
- `cdk agent deterministic:*` → LLM workflows
- `cdk agent exploratory` → LLM workflows
- `cdk llm:*` → deprecated, hidden, but still 20+ commands
- `cdk docs enrich` → LLM docs enrichment
- `cdk repo review/commit/precommit` → agent-driven

**No single entrypoint for LLM operations.** Users must remember `cdk agent`, `cdk llm`, `cdk docs enrich`, `cdk repo review` — four different commands for four flavors of the same thing.

### Problem 5: Independent CLIs disconnected from moon

| CLI | Called how? | Should be |
|-----|------------|-----------|
| `cfxdevkit-devnode` | Direct binary | `moon run devnode:start` |
| `cfxdevkit-devnode-server` | Direct binary | `moon run devnode:serve` |
| `cfxdevkit-mcp` | Direct binary | `moon run mcp:start` |
| `scaffold-cli` | Direct binary | `moon run scaffold:new` |
| `cfx-docs-pipeline` | Direct binary | `moon run docs:sync` |
| `cfxdevkit-extract-contracts` | Direct binary | `moon run contracts:extract` |
| `cas-setup` | Direct binary | `moon run cas:setup` |

Each is a standalone binary. None are callable via moon.

---

## 2. New Architecture

### 2.1 `cdk` — Framework CLI (Narrow Scope)

**Package**: `@cfxdevkit/tooling-cli` → renamed to `@cfxdevkit/cdk`
**Binary**: `cdk`
**CLI Framework**: clipanion (keep, but slim down)

**Scope**: Framework operations only. Commands that developers run **against framework packages**. No repo-level concerns (no merges, no commits, no PRs, no multi-package validation).

#### New `cdk` Commands

```
cdk build        [pkg]              Build framework packages (or specific package)
cdk test         [pkg]              Run framework tests (or specific package)
cdk lint         [pkg]              Lint framework packages
cdk typecheck    [pkg]              Typecheck framework packages
cdk check        [pkg]              Quality check framework packages
cdk generate     [target]           Framework code generation (api|readme|structure)
cdk contracts extract <dir>         Extract ABIs/bytecode from Hardhat artifacts
cdk contracts compile [project]     Compile contracts with Hardhat
cdk devnode [command]               Local dev node (core/espace RPC)
  devnode start [port]              Start local node
  devnode stop                      Stop local node
  devnode status                    Check node status
cdk devnode:serve [port] [host]     Start devnode-server control plane
cdk sign message <text> [flags]     Headless message signing
cdk sign typed-data <file> [flags]  Headless typed-data signing
cdk signer setup                    Interactive signer wizard
cdk signer status [--json]          Show active signer
cdk signer list [--json]            List signers
cdk signer use <name>               Switch default signer
cdk mcp start [port]                Start MCP server for AI agents
cdk derive [--mnemonic] [--generate] Derive dual-space accounts
cdk generate-mnemonic [--strength]   Generate BIP-39 mnemonic
cdk status [--chain]                Check chain status + latency
cdk docs generate [target]          Deterministic docs generation (no LLM)
cdk docs validate [target]          Validate docs structure
cdk extract-contracts <dir>         Alias for contracts extract
cdk scaffold [command]              Project scaffolding
  scaffold new <dir>                Interactive scaffold
  scaffold list                     List templates/targets
```

**What's REMOVED from `cdk`**:
- ❌ `cdk repo` (all 12 subcommands) → moon tasks
- ❌ `cdk agent` (all 13 subcommands) → moon agent tasks
- ❌ `cdk llm` (all 20+ commands) → deprecated, remove entirely
- ❌ `cdk docs sync/validate` → moon docs tasks (keep `generate`/`validate` as framework operations)
- ❌ `cdk devnode start/stop/status` as separate commands (keep as subcommands of `cdk devnode`)
- ❌ `cdk sign`/`cdk signer` namespace pattern (flatten to `cdk sign`/`cdk signer`)

### 2.2 `moon` — Repository Entrypoint (Broad Scope)

**Package**: Already configured in `.moon/workspace.yml`
**Binary**: `moon` (already installed as `@moonrepo/cli`)
**Entry**: `moon run <task-name>`

#### New Moon Task Layout

```
repos/
├── cfx-core/packages/devnode/moon.yml      → devnode:start, devnode:stop, devnode:status
├── cfx-core/packages/devnode/moon.yml      → devnode:serve (devnode-server)
├── cfx-tools/packages/mcp-server/moon.yml  → mcp:start, mcp:stop
├── cfx-tools/packages/cli/moon.yml         → cdk:build
├── cfx-tools/packages/codegen-contracts/moon.yml → contracts:extract
├── cfx-tools/packages/docs-pipeline/moon.yml → docs:sync, docs:validate, docs:enrich
├── cfx-tools/infra/tooling-cli/moon.yml    → agent:chat, agent:deterministic:*, agent:exploratory:*
├── cfx-tools/packages/arch-check/moon.yml  → arch-check, check:hotspots, check:secrets
├── cfx-tools/infra/tooling-cli/moon.yml    → repo:build, repo:run, repo:gate, repo:check
├── cfx-tools/infra/tooling-cli/moon.yml    → repo:generate, repo:merge, repo:commit
├── cfx-tools/infra/tooling-cli/moon.yml    → repo:review, repo:precommit
├── devkit-workspace/packages/scaffold-cli/moon.yml → scaffold:new, scaffold:list
├── projects/cas/packages/setup/moon.yml    → cas:setup
└── cfx-keys/packages/signer-session/moon.yml → sign:message, sign:typed-data, signer:*
```

#### Full Moon Task Tree

```
# ── Standard Package Tasks (already exist, expanded) ──
moon run :build              → build all packages (concurrency 3)
moon run :test               → test all packages (concurrency 1)
moon run :lint               → lint all packages (concurrency 4)
moon run :typecheck          → typecheck all packages (concurrency 4)
moon run :check              → quality gate (all gates)
moon run :clean              → cleanup dist

# ── Quality Gates (single package) ──
moon run :gate:lint          → lint gate
moon run :gate:test          → test gate
moon run :gate:typecheck     → typecheck gate
moon run :gate:build         → build gate
moon run :gate:format        → format gate
moon run :gate:gitnexus      → gitnexus analyze

# ── Framework Operations (via cdk) ──
moon run cdk:build           → build framework packages
moon run cdk:test            → test framework packages
moon run cdk:lint            → lint framework packages
moon run cdk:typecheck       → typecheck framework packages
moon run cdk:check           → check framework packages
moon run cdk:generate        → framework code generation

# ── Contract Operations ──
moon run contracts:extract   → Hardhat artifacts → ABIs + TypeScript
moon run contracts:compile   → compile with Hardhat

# ── Documentation Operations ──
moon run docs:sync           → docs pipeline sync
moon run docs:validate       → docs validation
moon run docs:enrich         → LLM docs enrichment
moon run docs:wiki           → wiki operations
moon run docs:generate       → deterministic docs (api, readme, structure)
moon run docs:probe          → small model/data-path probe

# ── Repository Operations ──
moon run repo:build          → moon run :build (with structured output)
moon run repo:run            → run any repo command
moon run repo:gate           → re-run single quality gate
moon run repo:check          → structural checks (validation, hotspots, secrets, etc.)
moon run repo:arch-check     → full arch + docs contract check
moon run repo:generate       → api/readme/structure/unit-configs generators
moon run repo:merge          → deterministic PR merge
moon run repo:review         → agent-driven review
moon run repo:precommit      → precommit gate chain
moon run repo:commit         → hardened commit workflow
moon run repo:units          → list session presets

# ── Agent / LLM Operations ──
moon run agent:smoke         → agent smoke test
moon run agent:check         → agent check
moon run agent:merge         → agent merge
moon run agent:config        → agent config
moon run agent:models        → list LLM models
moon run agent:validate-models → probe LLM models
moon run agent:deterministic:docs-api   → LLM docs enrichment
moon run agent:deterministic:docs-api-probe → LLM docs probe
moon run agent:deterministic:readme-upkeep → README upkeep
moon run agent:deterministic:package-pages → package pages
moon run agent:deterministic:structure-upkeep → structure upkeep
moon run agent:deterministic:wiki-generate → wiki generation
moon run agent:exploratory:all → exploratory LLM workflows
moon run agent:chat          → interactive PI session
moon run agent:commit        → PI commit session
moon run agent:rpc           → PI RPC session
moon run agent:print         → one-shot PI print
moon run agent:endpoints     → print agent endpoints
moon run agent:modes         → print available modes
moon run agent:status        → print agent status

# ── Devnode Operations ──
moon run devnode:start       → start local Conflux node
moon run devnode:stop        → stop local Conflux node
moon run devnode:status      → check node status
moon run devnode:serve       → start devnode-server control plane

# ── Signing Operations ──
moon run sign:message        → headless message signing
moon run sign:typed-data     → headless typed-data signing
moon run signer:setup        → interactive signer wizard
moon run signer:status       → show active signer
moon run signer:list         → list signers
moon run signer:set          → set config value
moon run signer:use          → switch default signer

# ── Scaffolding Operations ──
moon run scaffold:new        → interactive project scaffold
moon run scaffold:list       → list templates and targets

# ── Project Operations ──
moon run cas:setup           → CAS instance setup wizard

# ── MCP Operations ──
moon run mcp:start           → start MCP server
moon run mcp:stop            → stop MCP server
```

---

## 3. Migration Plan

### Phase 0: Cleanup (no breaking changes)

**Goal**: Remove deprecated commands, reduce cognitive load

| Action | File | Details |
|--------|------|---------|
| Remove `cdk llm` namespace | `tooling-cli/src/registry.ts` | Delete `llmToolingNamespace` import and registration |
| Remove 20+ hidden `cdk llm:*` commands | `tooling-cli/src/llm/namespace.ts` | Delete entire file |
| Remove deprecated `cdk agent:*` hidden commands | `tooling-cli/src/agent/help.ts` | Clean up help text |
| Rename package | `tooling-cli/package.json` | `@cfxdevkit/tooling-cli` → `@cfxdevkit/cdk` |
| Add `@cfxdevkit/cdk` alias in root | `package.json` | `pnpm run cdk` stays same |

### Phase 1: Moon task definitions for existing `cdk` commands

**Goal**: Every `cdk repo`/`cdk agent`/`cdk docs` command gets a moon task equivalent

| Action | File | Details |
|--------|------|---------|
| Add `repo:*` tasks | `tooling-cli/moon.yml` | `repo:build`, `repo:run`, `repo:gate`, `repo:check`, `repo:generate`, `repo:merge`, `repo:review`, `repo:precommit`, `repo:commit`, `repo:units` |
| Add `agent:*` tasks | `tooling-cli/moon.yml` | `agent:smoke`, `agent:check`, `agent:merge`, `agent:config`, `agent:chat`, `agent:commit`, `agent:rpc`, `agent:print`, `agent:deterministic:*`, `agent:exploratory:*` |
| Add `docs:*` tasks | `tooling-cli/moon.yml` | `docs:sync`, `docs:validate`, `docs:enrich`, `docs:wiki`, `docs:generate`, `docs:probe` |
| Add `devnode:*` tasks | `devnode/moon.yml` | `devnode:start`, `devnode:stop`, `devnode:status`, `devnode:serve` |
| Add `sign:*`/`signer:*` tasks | `signer-session/moon.yml` | `sign:message`, `sign:typed-data`, `signer:setup`, `signer:status`, `signer:list`, `signer:use` |
| Add `scaffold:*` tasks | `scaffold-cli/moon.yml` | `scaffold:new`, `scaffold:list` |
| Add `contracts:*` tasks | `codegen-contracts/moon.yml` | `contracts:extract` |
| Add `cas:*` tasks | `cas-setup/moon.yml` | `cas:setup` |
| Add `mcp:*` tasks | `mcp-server/moon.yml` | `mcp:start`, `mcp:stop` |
| Add `arch-check` task | `arch-check/moon.yml` | `arch-check` (full arch + docs contract) |

**Moon task pattern for wrapper tasks**:

```yaml
# tooling-cli/moon.yml
tasks:
  repo:build:
    command: 'cdk repo build'
    dependsOn: []
    options:
      cache: true
      runFromWorkspaceRoot: true

  repo:gate:
    command: 'cdk repo gate'
    dependsOn: []
    options:
      runFromWorkspaceRoot: true

  agent:chat:
    command: 'cdk agent chat'
    dependsOn: []
    options:
      runFromWorkspaceRoot: true
      cache: false

  agent:deterministic:docs-api:
    command: 'cdk agent deterministic docs-api'
    dependsOn: []
    options:
      runFromWorkspaceRoot: true
      cache: false
```

This is a **compatibility layer** — moon tasks that call `cdk` commands. Users start using `moon run repo:build` instead of `cdk repo build`.

### Phase 2: Slim `cdk` to framework scope

**Goal**: Remove repo/agent/docs from `cdk`, keep only framework operations

| Action | File | Details |
|--------|------|---------|
| Remove `repo` namespace | `tooling-cli/src/registry.ts` | Delete `repoToolingNamespace` import and registration |
| Remove `agent` namespace | `tooling-cli/src/registry.ts` | Delete `agentToolingNamespace` import and registration |
| Remove `llm` namespace | (already done in Phase 0) | |
| Remove `docs` namespace (keep framework docs) | `tooling-cli/src/registry.ts` | Keep only `docs:generate`, `docs:validate`; remove LLM enrichment |
| Remove `devnode` namespace | `tooling-cli/src/registry.ts` | Keep `devnode` as subcommand under `cdk devnode` |
| Flatten `sign`/`signer` | `tooling-cli/src/` | Flatten to `cdk sign` and `cdk signer` without namespace |
| Update help text | `tooling-cli/src/run.ts` | Update format to reflect narrow scope |

### Phase 3: Replace `moon run <task>` calls to `cdk` with direct calls

**Goal**: Remove the backwards wiring — moon tasks no longer call `cdk`

| Action | Details |
|--------|---------|
| `moon run repo:build` → `moon run :build` | Direct moon build, remove `cdk repo build` call |
| `moon run repo:gate` → `moon run :gate:*` | Use moon's built-in quality gate tasks |
| `moon run repo:check` → `moon run arch-check` | Call arch-check directly via tsx (already works) |
| `moon run repo:generate` → `moon run generate-api/readme/structure` | Direct arch-check generators |
| `moon run repo:merge` → `moon run agent:merge` | Direct agent merge |
| `moon run agent:chat` → Direct PI session | No wrapper needed — call PI agent directly |
| `moon run agent:deterministic:*` → Direct LLM workflows | Call llm-agents worker directly |
| `moon run docs:sync` → `moon run docs-pipeline:sync` | Call docs-pipeline package directly |

### Phase 4: Root package.json scripts cleanup

**Goal**: Simplify root scripts to single entrypoint

```json
{
  "scripts": {
    "build":     "moon run :build --concurrency 3",
    "test":      "moon run :test --concurrency 1",
    "lint":      "moon run :lint --concurrency 4",
    "typecheck": "moon run :typecheck --concurrency 4",
    "check":     "moon run :check",
    "clean":     "moon run :clean",
    "format":    "biome format --write .",
    "format:check":"biome format .",

    "cdk":       "cdk",                      ← direct binary, no pnpm filter

    "repo:build":    "moon run :build --concurrency 3",
    "repo:check":    "moon run :check",
    "repo:merge":    "moon run repo:merge",
    "repo:generate": "moon run repo:generate",

    "agent:chat":    "moon run agent:chat",
    "agent:merge":   "moon run agent:merge",
    "agent:deterministic": "moon run agent:deterministic",
    "agent:exploratory":   "moon run agent:exploratory:all",

    "docs:sync":     "moon run docs:sync",
    "docs:enrich":   "moon run docs:enrich",
    "docs:wiki":     "moon run docs:wiki",
    "docs:review":   "moon run docs:review",

    "devnode:start": "moon run devnode:start",
    "devnode:stop":  "moon run devnode:stop",
    "devnode:status":"moon run devnode:status",

    "sign:message":  "moon run sign:message",
    "signer:setup":  "moon run signer:setup",

    "scaffold:new":  "moon run scaffold:new",
    "scaffold:list": "moon run scaffold:list",

    "contracts:extract": "moon run contracts:extract",

    "mcp:start":     "moon run mcp:start",
    "mcp:stop":      "moon run mcp:stop"
  }
}
```

---

## 4. Command Migration Matrix

### What moves from `cdk` → `moon run`

| Old `cdk` Command | New `moon run` Command | Rationale |
|-------------------|----------------------|-----------|
| `cdk repo build` | `moon run :build` or `moon run repo:build` | Core repo operation |
| `cdk repo run` | `moon run repo:run` | Core repo operation |
| `cdk repo gate` | `moon run :gate:*` | Quality gates |
| `cdk repo check` | `moon run repo:check` | Structural checks |
| `cdk repo arch-check` | `moon run arch-check` | Architecture validation |
| `cdk repo generate` | `moon run repo:generate` | Doc generation |
| `cdk repo merge` | `moon run repo:merge` | PR merge |
| `cdk repo review` | `moon run repo:review` | Agent review |
| `cdk repo precommit` | `moon run repo:precommit` | Precommit gates |
| `cdk repo commit` | `moon run repo:commit` | Commit workflow |
| `cdk repo units` | `moon run repo:units` | Session presets |
| `cdk agent smoke` | `moon run agent:smoke` | Agent test |
| `cdk agent check` | `moon run agent:check` | Agent check |
| `cdk agent merge` | `moon run agent:merge` | Agent merge |
| `cdk agent config` | `moon run agent:config` | Agent config |
| `cdk agent chat` | `moon run agent:chat` | PI session |
| `cdk agent commit` | `moon run agent:commit` | PI commit |
| `cdk agent rpc` | `moon run agent:rpc` | PI RPC |
| `cdk agent print` | `moon run agent:print` | PI print |
| `cdk agent deterministic:*` | `moon run agent:deterministic:*` | LLM workflows |
| `cdk agent exploratory:*` | `moon run agent:exploratory:*` | LLM workflows |
| `cdk agent endpoints` | `moon run agent:endpoints` | Agent info |
| `cdk agent modes` | `moon run agent:modes` | Agent info |
| `cdk agent status` | `moon run agent:status` | Agent info |
| `cdk docs sync` | `moon run docs:sync` | Docs pipeline |
| `cdk docs validate` | `moon run docs:validate` | Docs validation |
| `cdk docs enrich` | `moon run docs:enrich` | LLM docs |
| `cdk docs wiki` | `moon run docs:wiki` | Wiki ops |
| `cdk docs review` | `moon run docs:review` | Docs review |
| `cdk devnode start` | `moon run devnode:start` | Node lifecycle |
| `cdk devnode stop` | `moon run devnode:stop` | Node lifecycle |
| `cdk devnode status` | `moon run devnode:status` | Node lifecycle |
| `cdk devnode:serve` | `moon run devnode:serve` | Control plane |
| `cdk sign message` | `moon run sign:message` | Signing |
| `cdk sign typed-data` | `moon run sign:typed-data` | Signing |
| `cdk signer setup` | `moon run signer:setup` | Signer config |
| `cdk signer status` | `moon run signer:status` | Signer config |
| `cdk signer list` | `moon run signer:list` | Signer config |
| `cdk signer use` | `moon run signer:use` | Signer config |

### What stays in `cdk` (framework scope)

| `cdk` Command | Rationale |
|---------------|-----------|
| `cdk build [pkg]` | Framework build — developer-facing |
| `cdk test [pkg]` | Framework tests — developer-facing |
| `cdk lint [pkg]` | Framework lint — developer-facing |
| `cdk typecheck [pkg]` | Framework typecheck — developer-facing |
| `cdk check [pkg]` | Framework quality check — developer-facing |
| `cdk generate [target]` | Framework code generation — developer-facing |
| `cdk contracts extract <dir>` | ABI extraction — developer-facing |
| `cdk contracts compile` | Contract compilation — developer-facing |
| `cdk extract <dir>` | Alias for contracts extract |
| `cdk mcp start [port]` | MCP server — developer-facing |
| `cdk derive [flags]` | Account derivation — developer-facing |
| `cdk generate-mnemonic [strength]` | Mnemonic generation — developer-facing |
| `cdk status [--chain]` | Chain status — developer-facing |
| `cdk docs generate [target]` | Deterministic docs — framework operation |
| `cdk docs validate [target]` | Docs validation — framework operation |

---

## 5. Implementation Details

### 5.1 `cdk` CLI after slimming

```
Usage:
  cdk <command> [args]

Commands:
  build        [pkg]              Build framework packages
  test         [pkg]              Run framework tests
  lint         [pkg]              Lint framework packages
  typecheck    [pkg]              Typecheck framework packages
  check        [pkg]              Quality check framework packages
  generate     [target]           Framework code generation
  contracts    <sub>              Contract operations
    contracts extract <dir>       Extract ABIs from Hardhat artifacts
    contracts compile [project]   Compile with Hardhat
  extract      <dir>              Alias for contracts extract
  devnode      [sub]              Local dev node operations
    devnode start [port]          Start local node
    devnode stop                  Stop local node
    devnode status                Check node status
  devnode:serve [port] [host]     Start devnode-server control plane
  sign         <sub>              Headless signing
    sign message <text> [flags]   Sign UTF-8 message
    sign typed-data <file> [flags] Sign typed data
  signer       <sub>              Signer identity management
    signer setup                  Interactive signer wizard
    signer status [--json]        Show active signer
    signer list [--json]          List signers
    signer use <name>             Switch default signer
  mcp          [port]             Start MCP server for AI agents
  derive       [flags]            Derive dual-space accounts
  generate-mnemonic [--strength]  Generate BIP-39 mnemonic
  status       [--chain]          Check chain status + latency
  docs         <sub>              Framework docs operations
    docs generate [target]        Deterministic docs generation
    docs validate [target]        Validate docs structure
```

### 5.2 Moon task definitions — key patterns

**Wrapper task** (calls cdk library):
```yaml
# tooling-cli/moon.yml
repo:build:
  command: 'cdk repo build --json'
  dependsOn: []
  options:
    cache: true
    runFromWorkspaceRoot: true
    mergeArgs: 'replace'
```

**Direct task** (calls internal package):
```yaml
# arch-check/moon.yml
arch-check:
  command: 'pnpm exec tsx src/bin/check-report.ts --write'
  dependsOn:
    - 'workspace-utils:build'
    - 'arch-rules:build'
  inputs:
    - '/repos/**/*'
    - '/projects/**/*'
    - 'src/**/*'
  outputs:
    - '/artifacts/llm/reports/arch-check-report.json'
    - '/artifacts/llm/reports/arch-check-report.md'
  options:
    cache: false
    runFromWorkspaceRoot: true
```

**Agent task** (calls PI agent directly, no cdk wrapper):
```yaml
# tooling-cli/moon.yml (agent tasks go here)
agent:chat:
  command: 'pnpm exec tsx src/agent/chat-worker.ts'
  dependsOn: []
  options:
    cache: false
    runFromWorkspaceRoot: true
```

**Devnode task**:
```yaml
# devnode/moon.yml
devnode:start:
  command: 'pnpm exec tsx src/cli.ts start'
  dependsOn: []
  options:
    cache: false
    runFromWorkspaceRoot: true

devnode:stop:
  command: 'pnpm exec tsx src/cli.ts stop'
  dependsOn: []
  options:
    cache: false
    runFromWorkspaceRoot: true
```

### 5.3 Dependency graph changes

```
Before:
  moon run :build     → pnpm build
  cdk repo build      → moon run :build
  cdk repo gate       → moon run :lint, :test, etc.

After:
  moon run :build     → pnpm build           (unchanged)
  moon run :check     → moon run :gate:lint + :gate:test + ...
  cdk build [pkg]     → vite build           (framework package only)
  cdk contracts extract → direct CLI call    (framework operation)
```

### 5.4 Breaking changes

| Change | Impact | Migration |
|--------|--------|-----------|
| `cdk repo build` → removed | CI scripts using it | Use `moon run repo:build` (Phase 1 compat) → `moon run :build` (Phase 3) |
| `cdk agent chat` → removed | CI scripts using it | Use `moon run agent:chat` (Phase 1 compat) → direct PI agent (Phase 3) |
| `cdk llm:*` → removed | Deprecated commands | Already hidden, no impact |
| `cdk docs sync` → removed | CI scripts | Use `moon run docs:sync` |
| Package name `@cfxdevkit/tooling-cli` → `@cfxdevkit/cdk` | Internal deps | Update import paths in: `tooling-cli/package.json` dependencies |

---

## 6. Final State Diagram

```
                    ┌──────────────────────────────────────────────┐
                    │               moon (entrypoint)              │
                    │                                              │
                    │  moon run :build         → all packages      │
                    │  moon run :check         → all gates         │
                    │  moon run agent:chat     → PI session        │
                    │  moon run docs:enrich    → LLM enrichment    │
                    │  moon run repo:merge     → PR merge           │
                    │  moon run devnode:start  → local node        │
                    └──────────────┬───────────────────────────────┘
                                   │
                      ┌────────────▼────────────┐
                      │  cdk (framework CLI)    │
                      │                         │
                      │  cdk build [pkg]        │
                      │  cdk test [pkg]         │
                      │  cdk contracts extract  │
                      │  cdk derive [flags]     │
                      │  cdk status [--chain]   │
                      │  cdk mcp start          │
                      │  cdk docs generate      │
                      └─────────────────────────┘
```

**Developer experience**:
- **Repo operations**: `moon run :build`, `moon run :check`, `moon run agent:chat` — single entrypoint
- **Framework operations**: `cdk build @cfxdevkit/executor`, `cdk contracts extract` — scoped to framework
- **Both coexist**: `moon run :build` for full repo, `cdk build @cfxdevkit/executor` for one package

---

*Generated: 2026-06-19*
