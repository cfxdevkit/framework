/**
 * Help messages for @cfxdevkit/llm-agents CLI.
 *
 * Extracted from bin.ts to keep the main entry point under the file size limit.
 */

export function printMainHelp(): void {
  console.log(`Usage: pnpm run llm-agents <subcommand> [args...]

Subcommands:

  Agent Core
    smoke [flags]                  Run targeted smoke test each action-mapped model
    config [show|reset|set ...]    Show or update shared repo agent harness config
    status                         Show current provider, mode, backend resolution state
    modes                          Show constrained exploratory operating modes
    endpoints                      Show local PI endpoint readiness & launch instructions
    providers                      Explain backend strategy for LiteLLM and direct providers

  Repo Operations
    check [flags]                  Run repo check, analyze findings, write OpenSpec artifacts
    merge [flags]                  Validate branch mergeability & optionally merge branches

  Deterministic Workflows
    deterministic <workflow> [args]  Run constrained deterministic-first workflows
      models                         List models for the resolved LLM provider
      validate-models [flags]        Probe models with cold/hot/json reliability checks
      precommit [flags]              Full commit pipeline with quality gates
      docs-api [flags] [prompt]      Generate API documentation
      docs-api-probe [flags] [prompt] Probe API documentation
      readme-upkeep [flags] [prompt] Refresh docs checks and upkeep
      package-pages [flags] [prompt] Generate package documentation pages
      structure-upkeep [flags] [prompt] Maintain repository structure documentation
      docs-upkeep [flags] [prompt]   General docs upkeep

  Exploratory Workflows
    exploratory <workflow> [args]  Run broader exploratory and maintenance workflows
      all                            Run all LLM repo upkeep agents
      actions                        List repo-specific actions
      action <name> [args]           Run a named repo action
      changeset [flags] [prompt]     Generate changeset for current changes
      ci-cd [flags] [prompt]         Run CI/CD pipeline checks
      docs-pipeline [flags] [prompt] Run docs pipeline
      health [flags] [prompt]        Run health check
      release [flags] [prompt]       Run release readiness check
      test-audit [flags] [prompt]    Audit test coverage
      test-upkeep [flags] [prompt]   Run test upkeep
      validation [flags] [prompt]    Run validation

  Interactive Sessions
    chat [flags] [prompt]          Launch PI-backed chat agent session
    commit [flags] [prompt]        Launch PI-backed interactive commit session
    print [flags] -- [prompt]      Run one-shot prompt through PI print runtime
    rpc                            Start PI-backed headless RPC runtime`);
}

export function printDeterministicHelp(): void {
  console.log(`cdk agent deterministic

Usage: pnpm run llm-agents deterministic <workflow> [args...]

Workflows:
  models                       List models for the resolved LLM provider
  validate-models [flags]      Probe models with reliability checks
  precommit [flags]            Full commit pipeline with quality gates
  docs-api [flags] [prompt]    Generate API documentation
  docs-api-probe [flags] [prompt] Probe API documentation
  readme-upkeep [flags] [prompt] Refresh docs upkeep
  package-pages [flags] [prompt] Generate package pages
  structure-upkeep [flags] [prompt] Maintain structure docs
  docs-upkeep [flags] [prompt] General docs upkeep`);
}

export function printExploratoryHelp(): void {
  console.log(`cdk agent exploratory

Usage: pnpm run llm-agents exploratory <workflow> [args...]

Workflows:
  all                        Run all LLM repo upkeep agents
  actions                    List repo-specific actions
  action <name> [args]       Run a named repo action
  changeset [flags] [prompt] Generate changeset
  ci-cd [flags] [prompt]     CI/CD pipeline checks
  docs-pipeline [flags] [prompt] Docs pipeline
  docs-upkeep [flags] [prompt] Docs upkeep
  health [flags] [prompt]    Health check
  release [flags] [prompt]   Release readiness
  test-audit [flags] [prompt] Test coverage audit
  test-upkeep [flags] [prompt] Test upkeep
  validation [flags] [prompt] Validation`);
}

export function printPrintMode(): void {
  console.log(`Usage: pnpm run llm-agents print -- [prompt]

Run a one-shot prompt through the PI print runtime.`);
}

export function printProvidersStrategy(): void {
  console.log(`cdk agent provider strategy

Recommendation: use PI as the runtime entrypoint and Lemonade as the default local backend.

Use direct Lemonade when you want:
  - local model discovery from the shared host Lemonade service
  - the simplest path for repository-local model work
  - PI and repo tooling to describe the same backend consistently

Use PI cloud providers when you want:
  - remote coding models through authenticated PI sessions
  - the built-in provider/auth flow instead of custom gateway wiring
  - one operator surface for chat, print, and RPC modes

Keep LiteLLM only when you need:
  - short-term compatibility with older direct worker flows
  - a temporary external gateway during the migration
  - explicit shared routing behavior that has not been moved into PI yet

Planned cdk agent behavior:
  - All agent commands will live under @cfxdevkit/llm-agents
  - PI runtime (chat/commit/print/rpc) remains the primary entrypoint
  - Direct LLM worker calls are deprecated in favor of PI sessions`);
}
