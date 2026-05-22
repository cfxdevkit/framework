import { relativeConfigPath } from './agent-runtime.js';
import type { ToolingCommandDefinition } from './contracts.js';

export const agentCommands = [
  {
    name: 'config',
    description: 'Show or update the shared repo agent harness config',
  },
  {
    name: 'status',
    description: 'Show the current provider, mode, and backend resolution state',
  },
  {
    name: 'modes',
    description: 'Show the constrained and exploratory operating modes',
  },
  {
    name: 'deterministic',
    description: 'Run constrained deterministic-first agent workflows',
  },
  {
    name: 'exploratory',
    description: 'Run broader exploratory and maintenance workflows',
  },
  {
    name: 'interactive',
    description: 'Launch the PI-backed interactive agent session',
  },
  {
    name: 'commit',
    description: 'Launch the PI-backed interactive commit session',
  },
  {
    name: 'print',
    description: 'Run a one-shot prompt through the PI print runtime',
  },
  {
    name: 'rpc',
    description: 'Start the PI-backed headless RPC runtime',
  },
  {
    name: 'providers',
    description: 'Explain backend strategy for LiteLLM and direct providers',
  },
] as const satisfies readonly ToolingCommandDefinition[];

export function printAgentHelp(): void {
  console.log(`cdk agent shapes the future interactive agent layer behind the root CLI.

Usage:
  cdk agent [--scope <unit>] config [show|reset|set ...]
  cdk agent [--scope <unit>] status
  cdk agent [--scope <unit>] modes
  cdk agent [--scope <unit>] deterministic <workflow> [args]
  cdk agent [--scope <unit>] exploratory <workflow> [args]
  cdk agent [--scope <unit>] interactive [workflow|prompt]
  cdk agent [--scope <unit>] commit [prompt]
  cdk agent [--scope <unit>] print -- [prompt]
  cdk agent rpc
  cdk agent providers

Current stance:
  - keep cdk as the repository control plane
  - use cdk agent as the interactive and embedded agent entrypoint
  - keep both LiteLLM and direct provider paths in the first migration

Commands:
  config        Show or update the global or scoped agent harness config
  status        Show the current provider, mode, and backend resolution state
  modes         Explain the deterministic and exploratory operating modes
  deterministic Run constrained deterministic-first workflows via the current llm-agents layer
  exploratory   Run broader maintenance workflows via the current llm-agents layer
  interactive   Start the PI-backed interactive session with repo-local resources
  commit        Start the PI-backed interactive commit session
  print         Run a one-shot prompt through the PI print runtime
  rpc           Start the PI-backed host mode for editor and dashboard integrations
  providers     Explain when to use LiteLLM, direct providers, or both

First implementation slice:
  1. Add a project-local agent extension package
  2. Register current providers and model discovery behind cdk agent
  3. Expose docs, review, commit, and validation workflows through agent tools
`);
}

export function printPrintMode(): void {
  console.log(`cdk agent print

Current role:
  - run a one-shot repo-aware prompt through the PI print runtime
  - use the active global or scoped harness config and current provider resolution
  - load the checked-in .pi resources from this repository

Usage:
  cdk agent --scope docs print -- --quick "Where should a docs alignment scanner live?"`);
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

Recommendation: keep both LiteLLM and direct providers.

Use LiteLLM when you want:
  - one gateway URL for multiple models
  - shared routing, policy, quotas, or observability
  - a team-default control point for model access

Use direct providers when you want:
  - local or provider-specific debugging
  - features that are awkward to preserve through a gateway
  - GitHub or custom provider flows that already exist in the repo

Planned cdk agent behavior:
  - default to auto selection
  - prefer LiteLLM when configured as the team gateway
  - allow explicit direct provider selection for local and advanced workflows
  - keep current provider discovery logic reusable during the first migration

Conclusion:
  LiteLLM should not be treated as the only backend and does not need to be removed.
  cdk agent should sit above the provider layer and support both gateway and direct modes.`);
}

export function printDeterministicHelp(): void {
  console.log(`Usage:
  cdk agent deterministic <workflow> [args]

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
  cdk agent [--scope <unit>] config show
  cdk agent [--scope <unit>] config show profiles
  cdk agent [--scope <unit>] config show profile <name>
  cdk agent [--scope <unit>] config show action-policy <action> [phase]
  cdk agent [--scope <unit>] config reset
  cdk agent [--scope <unit>] config set provider <lemonade|litellm|openai-compat|github-models>
  cdk agent [--scope <unit>] config set base-url <url>
  cdk agent [--scope <unit>] config set default-model <id>
  cdk agent [--scope <unit>] config set request-timeout-ms <ms>
  cdk agent [--scope <unit>] config set action <name> <id>
  cdk agent [--scope <unit>] config set profile-provider <name> <lemonade|litellm|openai-compat|github-models>
  cdk agent [--scope <unit>] config set profile-base-url <name> <url>
  cdk agent [--scope <unit>] config set profile-default-model <name> <id>
  cdk agent [--scope <unit>] config set profile-strategy <name> <auto|gateway|direct>
  cdk agent [--scope <unit>] config set action-policy <action> <profile>
  cdk agent [--scope <unit>] config set phase-policy <action> <phase> <profile>
  cdk agent [--scope <unit>] config set mode <deterministic|exploratory>
  cdk agent [--scope <unit>] config set provider-strategy <auto|gateway|direct>
  cdk agent [--scope <unit>] config set preserve-deterministic-artifacts <true|false>
  cdk agent [--scope <unit>] config set preserve-deterministic-sections <true|false>
  cdk agent [--scope <unit>] config set exploratory-code-changes <true|false>
  cdk agent [--scope <unit>] config set exploratory-wide-changes <true|false>

Without --scope this updates the shared repo harness config at ${relativeConfigPath()}.
With --scope it updates the unit overlay at ${relativeConfigPath('docs')} or another selected unit.`);
}
