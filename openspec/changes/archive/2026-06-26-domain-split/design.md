## Context

The monorepo has two independent domains that were accidentally merged into `@cfxdevkit/tooling-cli` (`cdk` binary):

**Domain 1: Blockchain Framework**
```
@   cfxdevkit/cdk         → RPC client, contracts, addresses, chains
@   cfxdevkit/cli         → `cfx` binary (status, derive, generate, contracts)
@   cfxdevkit/protocol    → protocol helpers
@   cfxdevkit/contracts   → contract bindings
@   cfxdevkit/compiler    → Solidity compilation
@   cfxdevkit/devnode     → local dev node lifecycle
@   cfxdevkit/services    → keystore/crypto backends
@   cfxdevkit/signer      → signer sessions
@   cfxdevkit/wallet      → wallet operations
```

**Domain 2: Repository Management**
```
@   cfxdevkit/workspace-utils → workspace root resolution
@   cfxdevkit/arch-rules      → architecture rules
@   cfxdevkit/arch-check      → repo health checks (hotspots, kebab, docs)
@   cfxdevkit/cdk-repo-check  → orchestrates checks + runs pnpm scripts
@   cfxdevkit/docs-pipeline   → doc generation/validation
@   cfxdevkit/llm-agents      → LLM workflows (agent-check, precommit, wiki)
```

Currently `tooling-cli` imports from BOTH domains and serves both via `cdk <namespace>`. The `cdk repo` namespace was never implemented, so repo ops have no terminal entry point. Blockchain ops are accessible via `cdk chain/keystore/address/units` but shouldn't be in a "tooling" package.

## Architecture Decision

### 1. `cfx` binary (`@cfxdevkit/cli`) → Blockchain CLI

```
┌──────────────────────────────────────────────────────────────────────┐
│  @   cfxdevkit/cli (`cfx`)                                           │
│                                                                      │
│  Commands:                                                           │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │ cfx status [--chain <id>] [--rpc <url>]                        │  │
│  │   → Ping chain status                                          │  │
│  │                                                                  │  │
│  │ cfx derive [--mnemonic <m>|--generate]                         │  │
│  │   → Derive accounts (already exists)                           │  │
│  │                                                                  │  │
│  │ cfx generate [--strength 128|256]                              │  │
│  │   → Generate mnemonic (already exists)                         │  │
│  │                                                                  │  │
│  │ cfx contracts extract [--artifacts <dir>] [--out <dir>]        │  │
│  │   → Extract ABIs (already exists)                              │  │
│  │                                                                  │  │
│  │ cfx chain list/show/resolve                                    │  │
│  │   → NEW: list/show/resolve chain configs                       │  │
│  │                                                                  │  │
│  │ cfx address validate/convert/normalize                         │  │
│  │   → NEW: validate/convert/normalize addresses                  │  │
│  │                                                                  │  │
│  │ cfx keystore status/list/use                                   │  │
│  │   → NEW: keystore operations                                   │  │
│  │                                                                  │  │
│  │ cfx units parse/format                                         │  │
│  │   → NEW: unit conversions                                      │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  Dependencies: @cfxdevkit/codegen-contracts, @cfxdevkit/cdk,         │
│                @cfxdevkit/services, @cfxdevkit/signer-session,       │
│                @cfxdevkit/devnode-server                             │
└──────────────────────────────────────────────────────────────────────┘
```

**Rationale**: `@cfxdevkit/cli` is the only CLI package without blockchain commands. It should be the home for all blockchain CLI operations. It already has `status`, `derive`, `generate`, `contracts extract`. We extend it with `chain`, `address`, `keystore`, `units` moved from `tooling-cli`.

**Moon tasks**: `devnode-*` and `signer-*` moon tasks stay in `tooling-cli/moon.yml` as orchestrators (they're not CLI code).

### 2. `repo` binary (`@cfxdevkit/tooling-cli`) → Repository CLI

```
┌──────────────────────────────────────────────────────────────────────┐
│  @   cfxdevkit/tooling-cli (`repo`)                                  │
│                                                                      │
│  Commands:                                                           │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │ repo check [target] [--fail-on-hard] [--quick]                 │  │
│  │   → Run repo validation (calls cdk-repo-check L1 directly)     │  │
│  │                                                                  │  │
│  │ repo precommit [--force] [--skip-checks]                       │  │
│  │   → Run precommit workflow (calls llm-agents L2 directly)      │  │
│  │                                                                  │  │
│  │ repo status                                                    │  │
│  │   → Show provider/model context                                │  │
│  │                                                                  │  │
│  │ repo actions [--mode <deterministic|exploratory>]              │  │
│  │   → List available repo actions (calls llm-agents)             │  │
│  │                                                                  │  │
│  │ repo run <action> [--quick] [--model <id>] [prompt]            │  │
│  │   → Run a specific action (calls llm-agents)                   │  │
│  │                                                                  │  │
│  │ repo review                                                    │  │
│  │   → Run review agent (calls llm-agents)                        │  │
│  │                                                                  │  │
│  │ repo docs generate [all|api|readme|structure|packages]         │  │
│  │   → Generate docs (calls docs-pipeline)                        │  │
│  │                                                                  │  │
│  │ repo docs validate [content|packages|wiki|all] [args]          │  │
│  │   → Validate docs build (calls docs-pipeline)                  │  │
│  │                                                                  │  │
│  │ repo merge [--dry-run] [--base <branch>] [branch...]           │  │
│  │   → Merge validation (calls llm-agents)                        │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  Dependencies: @cfxdevkit/cdk-repo-check, @cfxdevkit/docs-pipeline,  │
│                @cfxdevkit/workspace-utils                            │
│  Peer: @cfxdevkit/llm-agents                                        │
└──────────────────────────────────────────────────────────────────────┘
```

**Rationale**: The `repo` binary should ONLY serve repo management. It imports from `cdk-repo-check`, `docs-pipeline`, and `llm-agents` — all repo-adjacent packages. No blockchain deps.

**Binary name**: `repo` (not `cdk repo`). Clear, short, unambiguous.

### 3. Pure Libraries (No Change)

```
┌──────────────────────────────────────────────────────────────────────┐
│  @   cfxdevkit/cdk-repo-check                                        │
│  ───────────────────────────────────────────────────────────────────  │
│  Pure library. Callable from anywhere.                               │
│  - runRepoCheck('validation', [])    → full validation               │
│  - runRepoCheck('hotspots', args)    → hotspots only                 │
│  - runRepoCommand('lint', [])        → runs pnpm run lint at root    │
│  - defaultRenderer                   → render as text/json/compact    │
│  Dependencies: @cfxdevkit/arch-check, @cfxdevkit/workspace-utils     │
│                                                                      │
│  @   cfxdevkit/arch-check                                            │
│  ───────────────────────────────────────────────────────────────────  │
│  Pure library. Callable from anywhere.                               │
│  - runHotspotsCheck, runKebabGroupsCheck, runSecretsCheck, etc.      │
│  Dependencies: @cfxdevkit/workspace-utils                            │
│                                                                      │
│  @   cfxdevkit/docs-pipeline                                         │
│  ───────────────────────────────────────────────────────────────────  │
│  Pure library. Callable from anywhere.                               │
│  - discoverApiTargets, syncWikiContent, getDocsPipelineReviewContext │
│  Dependencies: @cfxdevkit/workspace-utils, mdx, mermaid, remark-*    │
│                                                                      │
│  @   cfxdevkit/llm-agents                                            │
│  ───────────────────────────────────────────────────────────────────  │
│  LLM workflows. Callable from anywhere.                              │
│  - runPrecommitWorkflow, runCommitWorkflow, runAgentCheck, etc.      │
│  - DEPENDENCY: uses cdk-repo-check (direct, not CLI)                │
│  Dependencies: @cfxdevkit/cdk-repo-check, @cfxdevkit/docs-pipeline   │
│                                                                      │
│  @   cfxdevkit/pi-customization                                      │
│  ───────────────────────────────────────────────────────────────────  │
│  PI (AI assistant) integration.                                      │
│  - /repo-check, /repo-commit, /repo-actions, /repo-run, /repo-status │
│  - Delegates to llm-agents (no duplication)                          │
│  - TUI rendering + user prompts only                                 │
│  Dependencies: @cfxdevkit/cli, @cfxdevkit/llm-agents                 │
└──────────────────────────────────────────────────────────────────────┘
```

## Dependency Graph (After)

```
┌──────────────────────────────────────────────────────────────────────┐
│  DEPENDENCY GRAPH (POST-SPLIT)                                       │
│                                                                      │
│  ┌──────────────────┐    ┌──────────────────┐                       │
│  │ workspace-utils  │    │   arch-rules     │                       │
│  │ (no deps)        │    │   (no deps)      │                       │
│  └────────┬─────────┘    └──────────────────┘                       │
│           │                                                          │
│           ▼                                                          │
│  ┌─────────────────────────────────┐                                │
│  │    arch-check                    │                                │
│  │    (workspace-utils)             │                                │
│  └──────────┬──────────────────────┘                                │
│             │                                                      │
│             ▼                                                      │
│  ┌─────────────────────────────────┐    ┌──────────────────────┐   │
│  │    cdk-repo-check               │    │   docs-pipeline      │   │
│  │    (arch-check, workspace-      │    │   (workspace-utils,  │   │
│  │      utils)                     │    │    mdx, mermaid)     │   │
│  └──────────┬──────────────────────┘    └──────────────────────┘   │
│             │                                                        │
│             ▼                                                        │
│  ┌──────────────────────────────────────────────────────┐           │
│  │    llm-agents                                        │           │
│  │    (cdk-repo-check, docs-pipeline)                   │           │
│  └──────────┬───────────────────────────────────────────┘           │
│             │                                                        │
│             ▼                                                        │
│  ┌──────────────────────────────────────────────────────┐           │
│  │    pi-customization                                  │           │
│  │    (cli, llm-agents, pi-coding-agent, pi-tui)        │           │
│  └──────────────────────────────────────────────────────┘           │
│                                                                      │
│  CLI layer:                                                          │
│  ┌──────────────┐     ┌──────────────┐                              │
│  │  cfx binary  │     │  repo binary │                              │
│  │  (@cfxdevkit/│     │  (@cfxdevkit/│                              │
│  │   cli)       │     │   tooling-   │                              │
│  └──────────────┘     └──────────────┘                              │
│                                                                      │
│  Moon tasks (orchestrators only):                                    │
│  ┌──────────────────────────────────────────────────────┐           │
│  │  tooling-cli/moon.yml contains ALL moon tasks        │           │
│  │  - They call CLI binaries OR library packages        │           │
│  │  - They are NOT namespaces (that's a CLI concept)    │           │
│  └──────────────────────────────────────────────────────┘           │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

## Migration Strategy

### Phase 1: Add `repo` namespace to tooling-cli (no breaking changes)

1. Create `tooling-cli/src/repo/namespace.ts` with all repo commands
2. Add `repoToolingNamespace` to `tooling-cli/src/registry.ts`
3. Add `repo` namespace to CLI help output
4. **Result**: `repo check`, `repo precommit`, `repo status`, `repo actions` work alongside `cdk chain/keystore/address/units`
5. **No breaking changes**: existing `cdk` commands still work

### Phase 2: Move blockchain commands to `cfx` (no breaking changes)

1. Move `tooling-cli/src/core/*-namespace.ts` to `@cfxdevkit/cli/src/commands/`
2. Add `chain`, `address`, `keystore`, `units` commands to `cfx`
3. Remove blockchain deps from `tooling-cli` package.json (they move to `cli`)
4. **Result**: `cfx chain/status`, `cfx address/convert`, `cfx keystore/status`, `cfx units/parse` work
5. **No breaking changes**: `cdk chain/status` still works (via moon task alias)

### Phase 3: Rename `cdk` binary to `repo` (breaking change)

1. Change binary name from `cdk` to `repo` in `tooling-cli/package.json`
2. Remove `cd` alias from `tooling-cli/package.json`
3. Update root `package.json` scripts: `cdk` → `repo`
4. **Result**: Only `repo check`, `repo precommit`, etc. work. No `cdk` binary.
5. **Breaking**: `cdk` binary no longer exists

### Phase 4: Fix `llm-agents` (independent of split)

1. Export all public functions from `llm-agents/src/index.ts`
2. Fix `agent-check` to call `runRepoCheck()` directly instead of `execFileAsync('pnpm', ['cdk', 'repo', 'check'])`
3. Remove `repoCheckCommand = ['cdk', 'repo', 'check']` constant
4. **Result**: LLM workflows call libraries directly, no CLI spawning

### Phase 5: Update PI integration (independent of split)

1. Update `/repo-check` to delegate to `repo check` command
2. Add `confirmBeforeWrite` to `repo_agent_check` tool
3. Update `repo-system.md` with correct commands
4. **Result**: PI commands work with the new surface

## Non-Goals

- Don't rename `@cfxdevkit/cdk-repo-check` to `@cfxdevkit/repo-check` (keep name, it's about repo checks not blockchain)
- Don't change `@cfxdevkit/cdk` (RPC client library, not CLI)
- Don't merge `llm-agents` into `tooling-cli` (they serve different purposes)
- Don't change `@cfxdevkit/pi-customization` (delegation is correct, just needs updates)
- Don't change moon repo structure (workspace.yml, tasks are fine)
- Don't remove moon tasks (they're orchestrators, not duplicate CLI)

## Risks

| Risk | Mitigation |
|------|------------|
| CI/CD scripts using `cdk chain` or `cdk keystore` will break in Phase 3 | Phase 1 provides `repo` binary alongside `cdk` during transition. Phase 2 keeps `cdk` working via moon tasks. |
| Developers familiar with `cdk repo check` must learn `repo check` | Clear migration path: `repo` is shorter than `cdk repo`. Root scripts maintain `pnpm repo:check` alias. |
| `@cfxdevkit/tooling-cli` losing blockchain deps might break imports | Phase 1 keeps blockchain deps. Phase 2 moves them to `cli` and removes from `tooling-cli`. |
| Moon tasks calling both `cfx` and `repo` binaries creates confusion | Moon tasks are internal orchestrators. Root scripts use `moon run` which abstracts the binary name. |

## Open Questions

1. Should `repo` binary be public (published to npm) or stay private? → Private (same as `cdk`)
2. Should `@cfxdevkit/cdk-repo-check` rename to `@cfxdevkit/repo-check`? → No, keep name to avoid breakage
3. Should `devnode-*` and `signer-*` moon tasks move to `tooling-cli`? → Yes, they're already there, they stay
4. Should `cfx` binary also handle `devnode` and `signer`? → No, those are moon tasks (orchestrators), not CLI commands
