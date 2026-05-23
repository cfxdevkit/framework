import { relativeConfigPath } from './agent-runtime.js';
import type { ToolingCommandDefinition } from './contracts.js';

export const agentCommands = [
  {
    name: 'config',
    description: 'Show or update the shared repo agent harness config',
    usage: '[--scope <preset>] config [show|reset|set ...]',
  },
  {
    name: 'status',
    description: 'Show the current provider, mode, and backend resolution state',
    usage: '[--scope <preset>] status',
  },
  {
    name: 'check',
    description: 'Run repo check, analyze findings locally, and write OpenSpec handoff artifacts',
    usage:
      '[--scope <preset>] check [--quick] [--dry-run|--no-write] [--create-branch] [--draft-pr]',
  },
  {
    name: 'merge',
    description:
      'Validate branch mergeability, enrich with PR state, and optionally merge selected branches',
    usage: '[--scope <preset>] merge [--dry-run] [--base <branch>] [branch...]',
  },
  {
    name: 'endpoints',
    description: 'Show local and GitHub PI endpoint readiness plus launch instructions',
    usage: '[--scope <preset>] endpoints',
  },
  {
    name: 'modes',
    description: 'Show the constrained and exploratory operating modes',
    usage: '[--scope <preset>] modes',
  },
  {
    name: 'deterministic',
    description: 'Run constrained deterministic-first agent workflows',
    usage: '[--scope <preset>] deterministic <workflow> [args]',
  },
  {
    name: 'exploratory',
    description: 'Run broader exploratory and maintenance workflows',
    usage: '[--scope <preset>] exploratory <workflow> [args]',
  },
  {
    name: 'chat',
    description: 'Launch the PI-backed chat agent session',
    usage: '[--scope <preset>] chat [--local|--github] [prompt]',
  },
  {
    name: 'commit',
    description: 'Launch the PI-backed interactive commit session',
    usage: '[--scope <preset>] commit [--local|--github] [prompt]',
  },
  {
    name: 'print',
    description: 'Run a one-shot prompt through the PI print runtime',
    usage: '[--scope <preset>] print [--local|--github] -- [prompt]',
  },
  {
    name: 'rpc',
    description: 'Start the PI-backed headless RPC runtime',
    usage: '[--scope <preset>] rpc [--local|--github]',
  },
  {
    name: 'providers',
    description: 'Explain backend strategy for LiteLLM and direct providers',
    usage: 'providers',
  },
] as const satisfies readonly ToolingCommandDefinition[];

export function printAgentHelp(): void {
  console.log(`cdk agent

Usage:
  cdk agent [--scope <preset>] config [show|reset|set ...]
  cdk agent [--scope <preset>] status
  cdk agent [--scope <preset>] check [--quick] [--dry-run|--no-write] [--create-branch] [--draft-pr]
  cdk agent [--scope <preset>] merge [--dry-run] [--base <branch>] [branch...]
  cdk agent [--scope <preset>] endpoints
  cdk agent [--scope <preset>] modes
  cdk agent [--scope <preset>] deterministic <workflow> [args]
  cdk agent [--scope <preset>] exploratory <workflow> [args]
  cdk agent [--scope <preset>] chat [--local|--github] [workflow|prompt]
  cdk agent [--scope <preset>] commit [--local|--github] [prompt]
  cdk agent [--scope <preset>] print [--local|--github] -- [prompt]
  cdk agent [--scope <preset>] rpc [--local|--github]
  cdk agent providers

Commands:
  config        Show or update the global or scoped agent harness config
  status        Show the current provider, mode, and backend resolution state
  check         Run repo check, prepare OpenSpec remediation changes, and optionally create a handoff branch/PR
  merge         Validate local branches and PR merge state, then optionally merge selected branches
  endpoints     Show the local Lemonade endpoint and GitHub PI endpoint launch status
  modes         Explain the deterministic and exploratory operating modes
  deterministic Run constrained deterministic-first workflows via the current llm-agents layer
  exploratory   Run broader maintenance workflows via the current llm-agents layer
  chat          Start the PI-backed chat session with repo-local resources
  commit        Start the PI-backed interactive commit session directly
  print         Run a one-shot prompt through the PI print runtime
  rpc           Start the PI-backed host mode for editor and dashboard integrations
  providers     Explain when to use LiteLLM, direct providers, or both

Notes:
  - use cdk repo review, precommit, and commit for the hardened repository workflows
  - cdk agent check only prepares OpenSpec changes when repo-check finds actionable warnings or errors
  - cdk agent merge validates local branch mergeability first; GitHub PR state is added when gh auth is available
  - use --create-branch to switch/create the suggested handoff branch after artifacts are written
  - use --draft-pr to create a draft PR with the generated handoff title/body; it implies --create-branch
  - use --local to force the PI session onto the local Lemonade-compatible endpoint
  - use --github to force the PI session onto GitHub Models; the CLI will use GITHUB_TOKEN or try gh auth token
  - use cdk agent endpoints to verify the local planning path and GitHub implementation path before running both in parallel
  - use --scope <preset> to add a targeted session preload on top of the shared monorepo baseline
  - chat and commit will open setup prompts before PI when launched without prompt text
  - the preset prompt changes the config overlay, default mode, and preloaded context for that session
`);
}

export function printEndpointsHelp(): void {
  console.log(`cdk agent endpoints

Current role:
  - show the explicit local and GitHub PI launch paths without editing shared provider config
  - explain GitHub auth expectations for the cloud endpoint
  - keep local planning and cloud implementation as separate operator entrypoints

Usage:
  cdk agent [--scope <preset>] endpoints
  cdk agent [--scope <preset>] chat --local [prompt]
  cdk agent [--scope <preset>] chat --github [prompt]
  cdk agent [--scope <preset>] print --local -- [prompt]
  cdk agent [--scope <preset>] print --github -- [prompt]
  cdk agent [--scope <preset>] rpc --local
  cdk agent [--scope <preset>] rpc --github

GitHub auth:
  - preferred: export GITHUB_TOKEN
  - fallback: gh auth login, then rerun the GitHub endpoint command
  - the CLI will try gh auth token automatically before failing
`);
}

export function printPrintMode(): void {
  console.log(`cdk agent print

Current role:
  - run a one-shot repo-aware prompt through the PI print runtime
  - use the active global or scoped harness config and current provider resolution
  - load the checked-in .pi resources from this repository

Usage:
  cdk agent --scope delivery print -- --quick "Where should a spec alignment scanner live?"`);
}

export function printRpcMode(): void {
  console.log(`cdk agent rpc

Current role:
  - expose a headless PI host for editor, dashboard, or service integrations
  - keep the same repo-local tools, prompts, and provider registrations
  - provide a clean bridge for future UI surfaces without redefining agent logic`);
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
  - default local runs to Lemonade-compatible configuration
  - keep PI as the only chat/runtime gateway for LLM work
  - preserve explicit provider selection for compatibility while legacy flows remain
  - remove LiteLLM-first guidance as direct worker paths are retired

Operator endpoints:
  - local PI: cdk agent chat --local
  - GitHub PI: cdk agent chat --github
  - endpoint readiness: cdk agent endpoints

Conclusion:
  New local setups should target Lemonade or PI cloud providers, not LiteLLM.
  LiteLLM remains a compatibility path, not the intended long-term local default.
`);
}

export function printDeterministicHelp(): void {
  console.log(`Usage:
  cdk agent deterministic <workflow> [args]

With --scope it uses the preset overlay at ${relativeConfigPath('delivery')} or another selected preset.

Workflows:
  models
  validate-models [flags]
  precommit [flags]
  docs-api [flags]
  docs-api-probe [flags]
  readme-upkeep [flags]
  package-pages [flags]
  structure-upkeep [flags]
  docs-upkeep [flags]

Deterministic mode is intended for constrained enrichment layered on deterministic artifacts.`);
}

export function printExploratoryHelp(): void {
  console.log(`Usage:
  cdk agent exploratory <workflow> [args]

With --scope it uses the preset overlay at ${relativeConfigPath('delivery')} or another selected preset.

Workflows:
  print [-- prompt]
  ask [-- prompt]
  review
  all
  test-upkeep [flags]
  commit [flags]
  actions
  action <name> [flags]
  test-audit [flags]
  health [flags]
  validation [flags]
  changeset [flags]
  release [flags]
  ci-cd [flags]
  docs-pipeline [flags]

Exploratory mode is intended for repo maintenance and broader agent-driven work.`);
}

export function printConfigHelp(): void {
  console.log(`Usage:
  cdk agent [--scope <preset>] config show
  cdk agent [--scope <preset>] config show profiles
  cdk agent [--scope <preset>] config show profile <name>
  cdk agent [--scope <preset>] config show action-policy <action> [phase]
  cdk agent [--scope <preset>] config reset
  cdk agent [--scope <preset>] config set provider <lemonade|litellm|openai-compat|github-models>
  cdk agent [--scope <preset>] config set base-url <url>
  cdk agent [--scope <preset>] config set default-model <id>
  cdk agent [--scope <preset>] config set request-timeout-ms <ms>
  cdk agent [--scope <preset>] config set action <name> <id>
  cdk agent [--scope <preset>] config set profile-provider <name> <lemonade|litellm|openai-compat|github-models>
  cdk agent [--scope <preset>] config set profile-base-url <name> <url>
  cdk agent [--scope <preset>] config set profile-default-model <name> <id>
  cdk agent [--scope <preset>] config set profile-strategy <name> <auto|gateway|direct>
  cdk agent [--scope <preset>] config set action-policy <action> <profile>
  cdk agent [--scope <preset>] config set phase-policy <action> <phase> <profile>
  cdk agent [--scope <preset>] config set mode <deterministic|exploratory>
  cdk agent [--scope <preset>] config set provider-strategy <auto|gateway|direct>
  cdk agent [--scope <preset>] config set preserve-deterministic-artifacts <true|false>
  cdk agent [--scope <preset>] config set preserve-deterministic-sections <true|false>
  cdk agent [--scope <preset>] config set exploratory-code-changes <true|false>
  cdk agent [--scope <preset>] config set exploratory-wide-changes <true|false>

Without --scope this updates the shared repo harness config at ${relativeConfigPath()}.
With --scope it updates the preset overlay at ${relativeConfigPath('delivery')} or another selected preset.`);
}
