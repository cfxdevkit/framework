# Spec: moon-entrypoint

`moon run` is the single entrypoint for all repository-wide operations and LLM-based workflows.

## Requirements

### REQ-1: moon adds repo operation tasks
The following moon tasks must be added to `@cfxdevkit/tooling-cli` moon.yml:

- [ ] `moon run repo:build [--json]` — build all packages (wraps `cdk repo build`)
- [ ] `moon run repo:run <target> [args] [--json]` — run any repo command
- [ ] `moon run repo:gate <name> [--json]` — re-run single quality gate
- [ ] `moon run repo:check <sub> [--json]` — structural checks
- [ ] `moon run repo:generate <sub> [--json]` — doc generators
- [ ] `moon run repo:merge [--base] [--dry-run] [--json]` — deterministic PR merge
- [ ] `moon run repo:review` — agent-driven review
- [ ] `moon run repo:precommit [args]` — precommit gate chain
- [ ] `moon run repo:commit [args]` — hardened commit workflow
- [ ] `moon run repo:units [list|show]` — session presets

### REQ-2: moon adds agent/LLM tasks
The following moon tasks must be added:

- [ ] `moon run agent:smoke` — agent smoke test
- [ ] `moon run agent:check [args]` — agent check
- [ ] `moon run agent:merge [--base] [--dry-run]` — agent merge
- [ ] `moon run agent:config <sub>` — agent config
- [ ] `moon run agent:chat [prompt]` — PI interactive session
- [ ] `moon run agent:commit [prompt]` — PI commit session
- [ ] `moon run agent:rpc [scope]` — PI RPC session
- [ ] `moon run agent:print [prompt]` — one-shot print
- [ ] `moon run agent:deterministic:docs-api` — LLM docs enrichment
- [ ] `moon run agent:deterministic:docs-api-probe` — LLM docs probe
- [ ] `moon run agent:deterministic:readme-upkeep` — README upkeep
- [ ] `moon run agent:deterministic:package-pages` — package pages
- [ ] `moon run agent:deterministic:structure-upkeep` — structure upkeep
- [ ] `moon run agent:deterministic:wiki-generate` — wiki generation
- [ ] `moon run agent:exploratory:all` — exploratory LLM workflows
- [ ] `moon run agent:endpoints` — print agent endpoints
- [ ] `moon run agent:modes` — print available modes
- [ ] `moon run agent:status` — print agent status

### REQ-3: moon adds docs pipeline tasks
- [ ] `moon run docs:sync [target]` — docs pipeline sync
- [ ] `moon run docs:validate [target]` — docs validation
- [ ] `moon run docs:enrich [target] [args]` — LLM docs enrichment
- [ ] `moon run docs:wiki [generate|sync|validate]` — wiki operations
- [ ] `moon run docs:probe api [args]` — small model probe
- [ ] `moon run docs:review [args]` — docs review

### REQ-4: moon adds devnode tasks
- [ ] `moon run devnode:start [--port] [--host] [--keystore-path]` — start dev node
- [ ] `moon run devnode:stop [--base-url]` — stop dev node
- [ ] `moon run devnode:status [--base-url] [--json]` — check dev node
- [ ] `moon run devnode:serve [port] [host]` — start devnode-server

### REQ-5: moon adds signing tasks
- [ ] `moon run sign:message <text> [flags]` — headless message signing
- [ ] `moon run sign:typed-data <file> [flags]` — headless typed-data signing
- [ ] `moon run signer:setup` — interactive signer wizard
- [ ] `moon run signer:status [--json]` — show active signer
- [ ] `moon run signer:list [--json]` — list signers
- [ ] `moon run signer:set <key> <value>` — set config value
- [ ] `moon run signer:use <name>` — switch default signer

### REQ-6: moon adds scaffolding tasks
- [ ] `moon run scaffold:new <dir> [--template] [--target]` — interactive scaffold
- [ ] `moon run scaffold:list` — list templates/targets

### REQ-7: moon adds misc tasks
- [ ] `moon run contracts:extract <dir>` — Hardhat artifacts → TypeScript
- [ ] `moon run mcp:start [port]` — start MCP server
- [ ] `moon run mcp:stop` — stop MCP server
- [ ] `moon run cas:setup` — CAS instance setup wizard
- [ ] `moon run arch-check` — full arch + docs contract check

## Scenarios

### Scenario 1: Full build via moon
**Given** a developer wants to build all packages
**When** they run `moon run :build --concurrency 3`
**Then** all framework and platform packages build in parallel
**And** the operation completes with exit code 0

### Scenario 2: LLM docs enrichment via moon
**Given** a developer wants to enrich docs for a package
**When** they run `moon run docs:enrich api --package @cfxdevkit/executor --quick`
**Then** the LLM docs enrichment runs through the agent deterministic workflow
**And** output is written to the docs pipeline
