# Tasks

## Phase 0: Cleanup (no breaking changes)

- [x] 0.1 Delete `tooling-cli/src/llm/namespace.ts` and `tooling-cli/src/llm/` directory
- [x] 0.2 Remove `llmToolingNamespace` import and registration from `tooling-cli/src/registry.ts`
- [x] 0.3 Remove `llmToolingNamespace` from `toolingNamespaces` array in `registry.ts`
- [x] 0.4 Update `tooling-cli/src/run.ts` — remove `cdk llm` from help text and command parsing
- [x] 0.5 Update `tooling-cli/src/agent/help.ts` — remove any references to `cdk llm` commands
- [x] 0.6 Run `cdk --help` and verify no `llm` namespace appears
- [x] 0.7 Run `pnpm --filter @cfxdevkit/tooling-cli typecheck` to confirm no import errors

## Phase 1: Moon task definitions (compatibility layer)

- [x] 1.1 Create `tooling-cli/moon.yml` — add `repo:*` task definitions (calls `cdk repo *`)
  - [ ] 1.1.1 Add `repo:build` task: `command: 'cdk repo build --json'`
  - [ ] 1.1.2 Add `repo:run` task: `command: 'cdk repo run'`
  - [ ] 1.1.3 Add `repo:gate` task: `command: 'cdk repo gate'`
  - [ ] 1.1.4 Add `repo:check` task: `command: 'cdk repo check'`
  - [ ] 1.1.5 Add `repo:generate` task: `command: 'cdk repo generate'`
  - [ ] 1.1.6 Add `repo:merge` task: `command: 'cdk repo merge'`
  - [ ] 1.1.7 Add `repo:review` task: `command: 'cdk repo review'`
  - [ ] 1.1.8 Add `repo:precommit` task: `command: 'cdk repo precommit'`
  - [ ] 1.1.9 Add `repo:commit` task: `command: 'cdk repo commit'`
  - [ ] 1.1.10 Add `repo:units` task: `command: 'cdk repo units'`
- [x] 1.2 Create/add `agent:*` tasks to `tooling-cli/moon.yml` (calls `cdk agent *`)
  - [ ] 1.2.1 Add `agent:smoke`, `agent:check`, `agent:merge`, `agent:config`
  - [ ] 1.2.2 Add `agent:chat`, `agent:commit`, `agent:rpc`, `agent:print`
  - [ ] 1.2.3 Add `agent:deterministic:*` tasks (docs-api, docs-api-probe, readme-upkeep, package-pages, structure-upkeep, wiki-generate)
  - [ ] 1.2.4 Add `agent:exploratory:all` task
  - [ ] 1.2.5 Add `agent:endpoints`, `agent:modes`, `agent:status`
- [x] 1.3 Add `docs:*` tasks to `tooling-cli/moon.yml` (calls `cdk docs *`)
  - [ ] 1.3.1 Add `docs:sync`, `docs:validate`, `docs:enrich`, `docs:wiki`, `docs:probe`, `docs:review`
- [x] 1.4 Add `devnode:*` tasks to `devnode/moon.yml` (wraps `cfxdevkit-devnode`)
  - [ ] 1.4.1 Add `devnode:start` task: `command: 'cfxdevkit-devnode start'`
  - [ ] 1.4.2 Add `devnode:stop` task: `command: 'cfxdevkit-devnode stop'`
  - [ ] 1.4.3 Add `devnode:status` task: `command: 'cfxdevkit-devnode status'`
  - [ ] 1.4.4 Add `devnode:serve` task: `command: 'cfxdevkit-devnode-server serve'`
- [x] 1.5 Add `sign:*`/`signer:*` tasks to `tooling-cli/moon.yml` (wraps signing CLI via `cdk`)
  - [ ] 1.5.1 Add `sign:message` task: `command: 'cdk sign message'`
  - [ ] 1.5.2 Add `sign:typed-data` task: `command: 'cdk sign typed-data'`
  - [ ] 1.5.3 Add `signer:setup`, `signer:status`, `signer:list`, `signer:set`, `signer:use`
- [x] 1.6 Add `scaffold:*` tasks to `scaffold-cli/moon.yml` (wraps `scaffold-cli`)
  - [ ] 1.6.1 Add `scaffold:new` task: `command: 'scaffold-cli new'`
  - [ ] 1.6.2 Add `scaffold:list` task: `command: 'scaffold-cli list-templates'`
- [x] 1.7 Add `contracts:extract` task to `codegen-contracts/moon.yml` (wraps extraction CLI)
- [x] 1.8 Add `mcp:*` tasks to `mcp-server/moon.yml` (wraps MCP server binary)
  - [ ] 1.8.1 Add `mcp:start` task: `command: 'cfxdevkit-mcp'`
  - [ ] 1.8.2 Add `mcp:stop` task: `command: 'pkill -f cfxdevkit-mcp'`
- [x] 1.9 `cas:setup` task skipped — no `cas-setup` binary exists in repo
- [x] 1.10 Add `arch-check` task to `arch-check/moon.yml` (calls tsx directly)
  - [ ] 1.10.1 Add `arch-check` task: `command: 'pnpm exec tsx src/bin/check-report.ts --write'`
- [x] 1.11 Update root `package.json` scripts to use `moon run` for repo operations
  - [ ] 1.11.1 `build` → `moon run :build --concurrency 3`
  - [ ] 1.11.2 `test` → `moon run :test --concurrency 1`
  - [ ] 1.11.3 `lint` → `moon run :lint --concurrency 4`
  - [ ] 1.11.4 `typecheck` → `moon run :typecheck --concurrency 4`
  - [ ] 1.11.5 `check` → `moon run :check`
  - [ ] 1.11.6 `clean` → `moon run :clean`
  - [ ] 1.11.7 `cdk` → `cdk` (direct binary)
  - [ ] 1.11.8 `repo:*` scripts → `moon run repo:*`
  - [ ] 1.11.9 `agent:*` scripts → `moon run agent:*`
  - [ ] 1.11.10 `docs:*` scripts → `moon run docs:*`
  - [ ] 1.11.11 Add `devnode:*`, `sign:*`, `scaffold:*`, `contracts:*`, `mcp:*` scripts
- [ ] 1.12 Verify Phase 1: `moon run repo:build` works (calls `cdk repo build`)
- [ ] 1.13 Verify Phase 1: `moon run agent:chat --help` works (calls `cdk agent chat --help`)

## Phase 2: Slim `cdk` to framework scope

- [ ] 2.1 Remove `repoToolingNamespace` from `tooling-cli/src/registry.ts`
  - [ ] 2.1.1 Delete `tooling-cli/src/repo/namespace.ts`
  - [ ] 2.1.2 Delete `tooling-cli/src/repo/*.ts` files
  - [ ] 2.1.3 Remove import and registration of `repoToolingNamespace`
  - [ ] 2.1.4 Remove `repo` from `toolingNamespaces` array
- [ ] 2.2 Remove `agentToolingNamespace` from `tooling-cli/src/registry.ts`
  - [ ] 2.2.1 Delete `tooling-cli/src/agent/namespace.ts`
  - [ ] 2.2.2 Delete `tooling-cli/src/agent/*.ts` files
  - [ ] 2.2.3 Remove import and registration of `agentToolingNamespace`
  - [ ] 2.2.4 Remove `agent` from `toolingNamespaces` array
- [ ] 2.3 Remove `devnodeToolingNamespace` from `tooling-cli/src/registry.ts`
  - [ ] 2.3.1 Delete `tooling-cli/src/devnode-namespace.ts`
  - [ ] 2.3.2 Remove import and registration of `devnodeToolingNamespace`
  - [ ] 2.3.3 Remove `devnode` from `toolingNamespaces` array
- [ ] 2.4 Remove `signToolingNamespace` from `tooling-cli/src/registry.ts`
  - [ ] 2.4.1 Delete `tooling-cli/src/sign-namespace.ts`
  - [ ] 2.4.2 Remove import and registration of `signToolingNamespace`
  - [ ] 2.4.3 Remove `sign` from `toolingNamespaces` array
- [ ] 2.5 Remove `signerToolingNamespace` from `tooling-cli/src/registry.ts`
  - [ ] 2.5.1 Delete `tooling-cli/src/signer-namespace.ts`
  - [ ] 2.5.2 Remove import and registration of `signerToolingNamespace`
  - [ ] 2.5.3 Remove `signer` from `toolingNamespaces` array
- [ ] 2.6 Flatten remaining `cdk` commands to top-level
  - [ ] 2.6.1 `cdk devnode start/stop/status` → `cdk devnode [start|stop|status]`
  - [ ] 2.6.2 `cdk devnode:serve` → `cdk devnode:serve` (keep as is)
  - [ ] 2.6.3 `cdk sign message` → `cdk sign message` (keep as is)
  - [ ] 2.6.4 `cdk sign typed-data` → `cdk sign typed-data` (keep as is)
  - [ ] 2.6.5 `cdk signer setup/status/list/use` → `cdk signer setup/status/list/use`
- [ ] 2.7 Update `formatToolingHelp()` in `tooling-cli/src/run.ts` to reflect slim scope
- [ ] 2.8 Run `cdk --help` and verify only framework commands appear
- [ ] 2.9 Run `pnpm --filter @cfxdevkit/tooling-cli build` to confirm build passes
- [ ] 2.10 Run `pnpm --filter @cfxdevkit/tooling-cli typecheck` to confirm no errors
- [ ] 2.11 Verify `cdk repo build` returns "Unknown command" error

## Phase 3: Remove backwards wiring

- [ ] 3.1 Replace `moon run repo:build` in `tooling-cli/moon.yml` → direct `moon run :build` call
  - [ ] 3.1.1 Change `command: 'cdk repo build --json'` → `command: 'moon run :build --concurrency 3'`
- [ ] 3.2 Replace `moon run repo:gate` → direct quality gate calls
  - [ ] 3.2.1 Change `command: 'cdk repo gate'` → `command: 'moon run :gate:<name>'` (dynamic per-subcommand)
- [ ] 3.3 Replace `moon run agent:chat` → direct PI agent call
  - [ ] 3.3.1 Change `command: 'cdk agent chat'` → `command: 'pnpm exec tsx src/agent/chat-worker.ts'`
- [ ] 3.4 Replace `moon run agent:deterministic:*` → direct LLM worker calls
  - [ ] 3.4.1 Change each deterministic task to call llm-agents worker directly
- [ ] 3.5 Replace `moon run docs:enrich` → direct docs-pipeline call
  - [ ] 3.5.1 Change `command: 'cdk docs enrich'` → `command: 'pnpm --filter @cfxdevkit/docs-pipeline cfx-docs-pipeline enrich'`
- [ ] 3.6 Replace `moon run devnode:start` → direct devnode CLI call
  - [ ] 3.6.1 Change `command: 'cfxdevkit-devnode start'` → `command: 'pnpm --filter @cfxdevkit/devnode cfxdevkit-devnode start'`
- [ ] 3.7 Replace `moon run sign:message` → direct signing CLI call
  - [ ] 3.7.1 Change `command: 'cdk sign message'` → `command: 'pnpm --filter @cfxdevkit/signer-session cfxdevkit-signer message'`
- [ ] 3.8 Replace `moon run scaffold:new` → direct scaffold-cli call
  - [ ] 3.8.1 Change `command: 'scaffold-cli new'` → `command: 'pnpm --filter @cfxdevkit/scaffold-cli scaffold-cli new'`
- [ ] 3.9 Replace `moon run contracts:extract` → direct codegen call
  - [ ] 3.9.1 Change `command: 'cfxdevkit-extract-contracts'` → `command: 'pnpm --filter @cfxdevkit/codegen-contracts cfxdevkit-extract-contracts'`
- [ ] 3.10 Replace `moon run mcp:start` → direct MCP server call
  - [ ] 3.10.1 Change `command: 'cfxdevkit-mcp'` → `command: 'pnpm --filter @cfxdevkit/mcp-server cfxdevkit-mcp'`
- [ ] 3.11 Verify all moon tasks work independently of `cdk` binary
  - [ ] 3.11.1 `moon run repo:build` succeeds
  - [ ] 3.11.2 `moon run agent:chat --help` succeeds
  - [ ] 3.11.3 `moon run docs:sync all` succeeds
  - [ ] 3.11.4 `moon run devnode:start` succeeds (dry-run or with --help)

## Final Validation

- [ ] 4.1 Run `cdk --help` and verify zero `repo`, `agent`, `llm` namespaces
- [ ] 4.2 Run `cdk --help` and verify all 20+ framework commands present
- [ ] 4.3 Run `pnpm --filter @cfxdevkit/tooling-cli test` — all tests pass
- [ ] 4.4 Run `pnpm --filter @cfxdevkit/tooling-cli typecheck` — zero errors
- [ ] 4.5 Run `moon run :typecheck` — all packages typecheck
- [ ] 4.6 Run `moon run :check` — all quality gates pass
- [ ] 4.7 Verify `cdk repo build` returns exit code 1 with "Unknown command" message
- [ ] 4.8 Verify `cdk agent chat --help` returns exit code 1 with "Unknown command" message
- [ ] 4.9 Verify `cdk llm models` returns exit code 1 with "Unknown command" message
- [ ] 4.10 Confirm zero deprecated hidden commands remain in `cdk` output
