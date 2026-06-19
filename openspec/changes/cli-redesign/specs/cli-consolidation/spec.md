# Spec: cli-consolidation

The repository achieves CLI consolidation: single entrypoint (`moon run`), removed deprecated commands, unified LLM operations.

## Requirements

### REQ-1: moon.yml tasks added across packages
Moon task definitions must be added to the appropriate package moon.yml files:

- [ ] `tooling-cli/moon.yml` — repo tasks, agent tasks, docs tasks
- [ ] `devnode/moon.yml` — devnode:start, devnode:stop, devnode:status, devnode:serve
- [ ] `signer-session/moon.yml` — sign:message, sign:typed-data, signer:*
- [ ] `scaffold-cli/moon.yml` — scaffold:new, scaffold:list
- [ ] `codegen-contracts/moon.yml` — contracts:extract
- [ ] `mcp-server/moon.yml` — mcp:start, mcp:stop
- [ ] `arch-check/moon.yml` — arch-check task
- [ ] `docs-pipeline/moon.yml` — docs:sync, docs:validate (if not existing)

### REQ-2: Root package.json scripts updated
Root `package.json` scripts must be simplified to single entrypoint pattern:

- [ ] `build` → `moon run :build --concurrency 3`
- [ ] `test` → `moon run :test --concurrency 1`
- [ ] `lint` → `moon run :lint --concurrency 4`
- [ ] `typecheck` → `moon run :typecheck --concurrency 4`
- [ ] `check` → `moon run :check`
- [ ] `clean` → `moon run :clean`
- [ ] `cdk` → `cdk` (direct binary, no pnpm filter)
- [ ] `repo:*` scripts → `moon run repo:*`
- [ ] `agent:*` scripts → `moon run agent:*`
- [ ] `docs:*` scripts → `moon run docs:*`
- [ ] `devnode:*` scripts → `moon run devnode:*`
- [ ] `sign:*` scripts → `moon run sign:*`
- [ ] `scaffold:*` scripts → `moon run scaffold:*`
- [ ] `contracts:*` scripts → `moon run contracts:*`
- [ ] `mcp:*` scripts → `moon run mcp:*`

### REQ-3: Deprecated commands removed
- [ ] Zero `hidden: true` deprecated commands in `cdk llm` (file deleted)
- [ ] Zero `cdk llm` references in `registry.ts`
- [ ] Zero `cdk repo` references in `registry.ts`
- [ ] Zero `cdk agent` references in `registry.ts`

### REQ-4: Backwards wiring removed
Moon tasks that previously called `cdk repo build` call `moon run :build` directly:

- [ ] `moon run repo:build` calls `moon run :build` (not `cdk repo build`)
- [ ] `moon run repo:gate` calls `moon run :gate:*` (not `cdk repo gate`)
- [ ] `moon run agent:chat` calls PI agent directly (not `cdk agent chat`)
- [ ] `moon run docs:enrich` calls docs-pipeline directly (not `cdk docs enrich`)

## Scenarios

### Scenario 1: Single entrypoint for repo operations
**Given** a developer wants to check the repository
**When** they run `moon run :check`
**Then** all quality gates execute (lint, test, typecheck, build, repo-check)
**And** the operation uses moon's built-in task graph, parallelism, and caching

### Scenario 2: Single entrypoint for LLM operations
**Given** a developer wants to start an interactive PI session
**When** they run `moon run agent:chat "refactor the executor package"`
**Then** the PI agent session starts with the given prompt
**And** no `cdk agent` or `cdk llm` command is needed

### Scenario 3: Zero deprecated hidden commands
**Given** a user runs `cdk --help`
**When** the help text is displayed
**Then** no `llm` namespace appears in the output
**And** no `repo` namespace appears in the output
**And** no `agent` namespace appears in the output
