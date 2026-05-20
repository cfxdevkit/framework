# Conflux DevKit — Framework Map

> Canonical reference for the monorepo. See also [ARCHITECTURE.md](ARCHITECTURE.md) for design rationale and [CONTRIBUTING.md](CONTRIBUTING.md) for workflow conventions.

---

## What This Repo Is

**Conflux DevKit** (`@cfxdevkit/framework`) is a pnpm monorepo for building on the
[Conflux Network](https://confluxnetwork.org/). It contains:

- Shared TypeScript framework packages (blockchain interaction, wallet, UI)
- Developer-platform tooling (MCP server, VS Code extension, scaffold CLI, local devnode)
- LLM automation pipeline (code quality, commit quality gate, doc generation)
- Example applications (showcase-local, showcase-public)
- The CAS (Contract Automation Service) project

Everything is structured in a **strict 5-tier dependency hierarchy** enforced by
`@cfxdevkit/arch-rules` and validated at commit time.

---

## 5-Tier Architecture

```
Tier -1  cross-cutting   repos/cfx-meta, repos/cfx-config        (devDep only)
Tier  0  framework       repos/cfx-core, cfx-keys, cfx-ui,       (published npm)
                         cfx-solidity
Tier  1  platform        repos/cfx-tools, repos/cfx-llm          (workspace:*)
Tier  2  domains         repos/cfx-domain                        (workspace:*)
Tier  3  projects        projects/cas, projects/examples, …      (internal)
```

**Dependency direction is strictly downward.** Higher tiers cannot be runtime deps
of lower tiers. Cross-cutting packages are devDependencies only.

Source of truth for these rules: `repos/cfx-meta/arch-rules.yaml`

---

## Repo-by-Repo Breakdown

### Tier -1 — Cross-Cutting

| Repo | Package | npm name | Purpose |
|------|---------|----------|---------|
| `repos/cfx-meta` | `packages/arch-rules` | `@cfxdevkit/arch-rules` | Machine-readable architecture rules (tier paths, versioning policy, import rules) |
| `repos/cfx-config` | `packages/tsconfig` | `@cfxdevkit/tsconfig` | Shared TypeScript config presets |
| `repos/cfx-config` | `packages/biome-config` | `@cfxdevkit/biome-config` | Shared Biome lint/format config |
| `repos/cfx-config` | `packages/moon-config` | `@cfxdevkit/moon-config` | Shared moon task templates |

### Tier 0 — Framework (Tier 0, published to npm)

#### `repos/cfx-core`
| Package | npm name | Purpose |
|---------|----------|---------|
| `packages/core` | `@cfxdevkit/core` | Conflux chain interaction, provider abstractions, network config |
| `packages/devnode` | `@cfxdevkit/devnode` | Local Conflux devnode launcher (Node.js binary wrapper) |
| `packages/executor` | `@cfxdevkit/executor` | Transaction execution primitives |
| `packages/protocol` | `@cfxdevkit/protocol` | Low-level protocol encoding/decoding |
| `packages/testing` | `@cfxdevkit/testing` | Shared test fixtures and helpers for framework packages |

#### `repos/cfx-keys`
| Package | npm name | Purpose |
|---------|----------|---------|
| `packages/wallet` | `@cfxdevkit/wallet` | HD wallet derivation, mnemonic management, Core/eSpace address pairing |
| `packages/services` | `@cfxdevkit/services` | Wallet service layer (key management over HTTP, session provider) |

#### `repos/cfx-ui`
| Package | npm name | Purpose |
|---------|----------|---------|
| `packages/ui-core` | `@cfxdevkit/ui-core` | Headless primitives (tokens, layout atoms) — no framework dep |
| `packages/ui` | `@cfxdevkit/ui` | Tailwind v4 component library (`AppShell`, `Topbar`, `MainGrid`, `Panel`, `Field`, `Notice`, `StatusGrid`, `Metric`, …) |
| `packages/react` | `@cfxdevkit/react` | React-specific hooks and context providers |
| `packages/theme` | `@cfxdevkit/theme` | Design token definitions (`--cfx-color-*`, `--cfx-space-*`, `--cfx-radius-*`) |
| `packages/wallet-connect` | `@cfxdevkit/wallet-connect` | Browser wallet connector (MetaMask / Fluent / WalletConnect) |
| `packages/defi-react` | `@cfxdevkit/defi-react` | DeFi UI helpers (`getPairedTokens`, WCFX wrapping modal) |

#### `repos/cfx-solidity`
| Package | npm name | Purpose |
|---------|----------|---------|
| `packages/contracts` | `@cfxdevkit/contracts` | Shared smart contract source |
| `packages/abis` | `@cfxdevkit/abis` | Generated ABI JSON + TypeScript types |
| `packages/compiler` | `@cfxdevkit/compiler` | Hardhat-based compilation pipeline |
| `packages/contracts-extract` | `@cfxdevkit/contracts-extract` | Extract deployed addresses from artifacts |

### Tier 1 — Platform

#### `repos/cfx-tools`
| Package | npm name | Purpose |
|---------|----------|---------|
| `packages/arch-check` | `@cfxdevkit/arch-check` | Architecture validation, hotspot scanning, secret scanning, doc alignment, CI checks, LLM corpus generation |
| `packages/client` | `@cfxdevkit/client` | HTTP client types shared between devnode-server and frontends (`KeystoreStatus`, `WalletSummary`, `NodeProfileSummary`, …) |
| `packages/devnode-server` | `@cfxdevkit/devnode-server` | Express server exposing keystore + devnode + node-profile REST API; consumed by showcase-local Next.js routes |
| `packages/cli` | `@cfxdevkit/cli` | Developer CLI (project commands, chain interaction) |
| `packages/scaffold-cli` | `@cfxdevkit/scaffold-cli` | Scaffold new packages / projects from templates |
| `packages/mcp-server` | `@cfxdevkit/mcp-server` | MCP server exposing Conflux DevKit tools to AI agents |
| `packages/vscode-extension` | `@cfxdevkit/vscode-extension` | VS Code extension (wallet panel, devnode control, status bar) |
| `packages/devcontainer` | `@cfxdevkit/devcontainer` | Dev container feature and scripts |
| `packages/docs-site` | `@cfxdevkit/docs-site` | Documentation site build pipeline |

#### `repos/cfx-llm`
| Package | npm name | Purpose |
|---------|----------|---------|
| `packages/llm-tools` | `@cfxdevkit/llm-tools` | CLI entry point for LLM automation pipeline (`llm commit`, `llm review`, `llm health`, etc.) |
| `packages/llm-client` | `@cfxdevkit/llm-client` | LLM provider client abstraction (OpenAI, Anthropic) |
| `packages/llm-agents` | `@cfxdevkit/llm-agents` | Autonomous agents (commit quality gate, doc generation, test upkeep) |

### Tier 2 — Domains

#### `repos/cfx-domain`
| Package | npm name | Purpose |
|---------|----------|---------|
| `packages/game-engine` | `@cfxdevkit/game-engine` | Shared game state and physics logic (used by chainbrawler, conflux-phaser) |
| `packages/automation` | `@cfxdevkit/automation` | Automation strategy primitives (used by CAS) |

### Tier 3 — Projects

#### `projects/cas` — Contract Automation Service
```
apps/
  backend/     Express API, keeper bot orchestration, chain interaction
  frontend/    Next.js 15 frontend, wallet connect, job management UI
packages/
  shared/      Types + API schema shared between backend and frontend
  setup/       Deployment / environment setup scripts
```

#### `projects/examples` — Developer Showcase
```
apps/
  showcase-local/   Next.js app demonstrating devnode + keystore locally
  showcase-public/  Next.js app demonstrating mainnet/testnet wallet flows
  examples/         Isolated minimal code examples
packages/
  showcase-ui/      App-specific UI components shared between showcases
```

---

## Build & Tooling Stack

| Tool | Role | Config |
|------|------|--------|
| **pnpm** (≥10) | Package manager, workspace protocol | `pnpm-workspace.yaml` |
| **moonrepo** | Task runner, build cache, task graph | `.moon/workspace.yml`, per-package `moon.yml` |
| **Vite 7** (Rolldown) | Library builds + app builds | per-package `vite.config.ts` |
| **TypeScript** | Type-checking, project references | `tsconfig.base.json`, per-package `tsconfig.json` |
| **Biome** | Lint + format | `biome.json` |
| **Vitest** | Unit + integration tests | per-package `vitest.config.ts` |
| **Playwright** | E2E tests | `playwright.config.ts` in relevant packages |
| **Hardhat** | Smart contract compilation + tests | `cfx-solidity` packages |
| **Changesets** | Semver versioning for Tier 0 | `.changeset/` |
| **OpenSpec** | Spec-driven change management | `openspec/` |
| **GitNexus** | Code intelligence (call graph, impact analysis) | `gitnexus` CLI / MCP tools |
| **arch-check** | Architecture + quality gates | `repos/cfx-tools/packages/arch-check` |

---

## pnpm Workspace Globs

Defined in `pnpm-workspace.yaml`:
```
repos/cfx-config/packages/*
repos/cfx-meta/packages/*
repos/*/packages/*
repos/cfx-tools/devtools/*
repos/cfx-tools/templates/*
projects/*/apps/*
projects/*/packages/*
projects/*/contracts
```

---

## Key Root Scripts

```bash
# Build / test / lint all
pnpm build            # moon run :build
pnpm test             # moon run :test --concurrency 1
pnpm lint             # moon run :lint
pnpm typecheck        # moon run :typecheck

# Architecture validation
pnpm arch:check       # arch-rules + import-boundary checks
pnpm check:hotspots   # file size + git churn analysis
pnpm check:secrets    # secret pattern scanning
pnpm check:docs       # markdown path + moon.yml alignment
pnpm check:corpus     # rebuild LLM corpus for AI agents

# LLM automation (main quality gate)
pnpm llm:commit       # full commit quality gate (runs arch-check + review + changeset suggestions)
pnpm llm:review       # code review pipeline
pnpm llm:health       # repo health report
pnpm llm:validation   # validation report

# GitNexus
pnpm gitnexus:status  # index status + symbol list
npx gitnexus analyze  # re-index codebase (run when index is stale)

# Dev
pnpm showcase         # start both showcase apps in parallel
pnpm devnode          # build + start devnode
```

---

## Architecture Validation — `arch-check`

The `@cfxdevkit/arch-check` package is the quality gate for the entire repo.
Run via `pnpm arch:check` or as part of `pnpm llm:commit`.

### What it checks

| Check | Command | Output |
|-------|---------|--------|
| Tier dependency rules | `arch-check` | `artifacts/llm/reports/arch-check-report.{json,md}` |
| Code size / churn | `check-hotspots` | `artifacts/llm/reports/code-hotspots.{json,md}` |
| Secret patterns | `check-secrets` | inline violations |
| Doc alignment | `check-docs` | `artifacts/llm/reports/docs-alignment.{json,md}` |
| LLM corpus | `check-corpus` | `artifacts/llm/corpus/` |

### Rules enforced by `arch-check`
- `requires-moon-yml` — publishable packages must have `moon.yml`
- `requires-src-index` — publishable packages must have `src/index.ts`
- `no-upward-imports` — no runtime dep on a higher tier
- `no-internal-reach` — no imports into `src/` internals of another package
- `file-size-hard-limit` — source files ≤ 300 lines (excluding `generated/`)
- `no-ts-nocheck` — no `// @ts-nocheck` in source
- `no-js-mjs-source-files` — source must be TypeScript

---

## GitNexus — Code Intelligence

GitNexus indexes the full call graph and exposes it via MCP tools.
**Index stats (last analyzed):** 14,697 symbols · 22,936 relationships · 300 execution flows

### MCP Resources (read these first for orientation)

| Resource URI | What it gives you |
|---|---|
| `gitnexus://repo/framework/context` | Codebase overview, index freshness |
| `gitnexus://repo/framework/clusters` | All functional areas / clusters |
| `gitnexus://repo/framework/processes` | All named execution flows |
| `gitnexus://repo/framework/process/{name}` | Step-by-step trace of one flow |

### MCP Tools (load via `tool_search` before calling)

| Tool | When to use |
|------|-------------|
| `mcp_gitnexus_query` | Explore a concept / feature area — returns process-grouped results |
| `mcp_gitnexus_context` | Full callers + callees + execution flows for one symbol |
| `mcp_gitnexus_impact` | Blast radius before editing — direction: `upstream` (who calls it) |
| `mcp_gitnexus_detect_changes` | Pre-commit: verify only expected symbols changed |
| `mcp_gitnexus_rename` | Rename a symbol safely across the call graph |
| `mcp_gitnexus_route_map` | Map execution routes between two symbols |
| `mcp_gitnexus_shape_check` | Validate a symbol's signature against expected shape |

### CLI (gitnexus)
```bash
npx gitnexus analyze      # re-index (must run first if index is stale)
npx gitnexus status       # freshness info
npx gitnexus list         # list all tracked repos
```

### Workflow rule
> **ALWAYS run `mcp_gitnexus_impact` before editing any function/class/method.**
> If risk is HIGH or CRITICAL, warn and confirm before proceeding.
> **ALWAYS run `mcp_gitnexus_detect_changes` before committing.**

---

## OpenSpec — Change Management

OpenSpec structures work into artifacts before code is written.
All changes live under `openspec/changes/<name>/`. Archived under `openspec/changes/archive/`.

### Artifact flow
```
proposal.md  →  design.md  →  specs/  →  tasks.md
 (why/what)      (how)      (per-cap)   (checklist)
```

### CLI
```bash
openspec new change "<kebab-name>"   # scaffold a new change
openspec list --json                  # list active changes
openspec status --change "<name>" --json
openspec instructions <artifact> --change "<name>" --json
openspec instructions apply --change "<name>" --json
```

### Agent slash commands
| Command | Action |
|---------|--------|
| `/opsx:explore` | Thinking-partner mode |
| `/opsx:propose <name>` | Generate all artifacts in one step |
| `/opsx:apply [name]` | Implement pending tasks |
| `/opsx:archive [name]` | Archive a completed change |

---

## Key Files to Know

| File | What it is |
|------|-----------|
| `ARCHITECTURE.md` | Human-readable architecture overview (aligned with arch-rules.yaml) |
| `repos/cfx-meta/arch-rules.yaml` | Machine-readable tier rules — source of truth |
| `pnpm-workspace.yaml` | Workspace package globs |
| `.moon/workspace.yml` | Moon project registry (all task targets) |
| `biome.json` | Root Biome config |
| `tsconfig.base.json` | Root TypeScript base config |
| `openspec/config.yaml` | OpenSpec schema + change root config |
| `CLAUDE.md` / `AGENTS.md` | AI agent instructions (GitNexus protocol, skills) |
| `artifacts/llm/reports/` | Latest arch-check, hotspots, docs-alignment reports |
| `artifacts/llm/corpus/` | LLM corpus bundles for AI agents |
| `artifacts/plan/` | Long-term phase completion plans |

---

## Package Conventions (Standard Layout)

```
<package>/
├── README.md            Scope, public API, deps, examples
├── CHANGELOG.md         Changesets-managed (Tier 0 only)
├── package.json         Name, exports map, peer deps, scripts
├── tsconfig.json        Extends @cfxdevkit/tsconfig/<flavor>.json
├── vite.config.ts       Library build (Tier 0/2) or app build
├── moon.yml             Task definitions (build, test, typecheck, lint)
├── src/
│   ├── index.ts         Public entrypoint — re-exports only, no logic
│   └── <feature>/       One folder per concern
│       ├── index.ts
│       ├── <feature>.ts
│       └── <feature>.test.ts
└── dist/                Build output (gitignored)
```

Rules:
- `src/index.ts` is re-exports only
- Named exports only (no default exports in published packages)
- `exports` map in `package.json` is the sole public API surface
- No imports into another package's `src/` internals

---

## Important Runtime Relationships

### Keystore / Devnode stack
```
@cfxdevkit/wallet            ← HD derivation, Core+eSpace address pairing
         ↓
@cfxdevkit/devnode-server    ← REST API (keystore + node-profile + devnode control)
  src/keystore/{runtime,domain,operations}.ts  ← internals
  src/keystore.ts                               ← public facade
         ↓
showcase-local /api/*        ← Next.js server routes (consumes built dist/)
         ↓
@cfxdevkit/client            ← shared HTTP types (KeystoreStatus, WalletSummary, etc.)
         ↓
showcase-local UI panels     ← app/panels/keystore/
```

### UI stack
```
@cfxdevkit/ui-core   ← headless tokens + layout atoms
      ↓
@cfxdevkit/ui        ← Tailwind v4 components (AppShell, Panel, Field, Notice, …)
      ↓
@cfxdevkit/react     ← React hooks + providers
      ↓
projects/cas/apps/frontend   ← imports Field from @cfxdevkit/ui directly
projects/examples/apps/showcase-{local,public}
```

### CAS Frontend Notes
- `next.config.ts` needs aliases for `@cfxdevkit/ui` and `@cfxdevkit/ui-core` pointing at
  built `dist/index.js` (Turbopack/Webpack both need absolute `dist/` paths for build;
  tsconfig still points at src for editor typecheck).
- `Field` component uses `className="field"` to preserve app-local styling.

### showcase-local Notes
- `next.config.ts` must list `serverExternalPackages: ['@cfxdevkit/devnode-server', '@cfxdevkit/devnode', '@xcfx/node']`
- After changing devnode-server, rebuild it before testing Next build/runtime
- Deterministic local mnemonic: `test test ... junk` (BIP39 standard test mnemonic)
- `app/workspace/` holds workspace internals; `app/panels/keystore/` has keystore UI

---

## Navigation Quickstart

### "How does X work?"
1. `mcp_gitnexus_query({ query: "concept" })` — find relevant execution flows
2. `mcp_gitnexus_context({ name: "FunctionName" })` — full callers + callees

### "What breaks if I change X?"
1. `mcp_gitnexus_impact({ target: "symbolName", direction: "upstream" })` — blast radius
2. Review risk level; if HIGH/CRITICAL, confirm before editing

### "Is my change safe to commit?"
1. `pnpm arch:check` — tier rules + import boundaries
2. `mcp_gitnexus_detect_changes()` — verify only expected symbols changed
3. `pnpm llm:commit` — full quality gate (arch + review + changeset suggestions)

### "Find where a type is used"
- `vscode_listCodeUsages({ symbol: "TypeName", ... })` — IDE-aware reference search
- or `mcp_gitnexus_context({ name: "TypeName" })` — call-graph-aware

### "What openspec changes are in flight?"
```bash
openspec list --json
```
Check `openspec/changes/` directory; archived work is under `openspec/changes/archive/`.
