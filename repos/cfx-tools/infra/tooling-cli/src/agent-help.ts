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
    description: 'Current mode-aware agent shim; planned TUI entrypoint later',
  },
  {
    name: 'print',
    description: 'Run a one-shot exploratory prompt through the current agent stack',
  },
  {
    name: 'rpc',
    description: 'Planned headless RPC agent host mode',
  },
  {
    name: 'providers',
    description: 'Explain backend strategy for LiteLLM and direct providers',
  },
] as const satisfies readonly ToolingCommandDefinition[];

export function printAgentHelp(): void {
  console.log(`cdk agent shapes the future interactive agent layer behind the root CLI.

Usage:
  cdk agent config [show|reset|set ...]
  cdk agent status
  cdk agent modes
  cdk agent deterministic <workflow> [args]
  cdk agent exploratory <workflow> [args]
  cdk agent interactive [workflow|prompt]
  cdk agent print -- [prompt]
  cdk agent rpc
  cdk agent providers

Current stance:
  - keep cdk as the repository control plane
  - use cdk agent as the interactive and embedded agent entrypoint
  - keep both LiteLLM and direct provider paths in the first migration

Commands:
  config        Show or update the shared repo agent harness config
  status        Show the current provider, mode, and backend resolution state
  modes         Explain the deterministic and exploratory operating modes
  deterministic Run constrained deterministic-first workflows via the current llm-agents layer
  exploratory   Run broader maintenance workflows via the current llm-agents layer
  interactive   Route to the current default mode from the shared harness config
  print         Run a one-shot exploratory prompt through the current agent stack
  rpc           Planned host mode for editor and dashboard integrations
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
  - run a one-shot repo-aware prompt through the existing llm-agents ask flow
  - use the shared harness config and current provider resolution
  - keep this shape stable so it can later map to the pi print mode

Usage:
  cdk agent print -- --quick "Where should a docs alignment scanner live?"`);
}

export function printRpcMode(): void {
  console.log(`cdk agent rpc

Planned role:
  - expose a headless agent host for editor, dashboard, or service integrations
  - keep the same repo-local tools, prompts, and provider registrations
  - provide a clean bridge for future UI surfaces without redefining agent logic

Status: not wired yet; this command currently documents the target shape.`);
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
  cdk agent config show
  cdk agent config reset
  cdk agent config set provider <lemonade|litellm|openai-compat|github-models>
  cdk agent config set base-url <url>
  cdk agent config set default-model <id>
  cdk agent config set request-timeout-ms <ms>
  cdk agent config set action <name> <id>
  cdk agent config set mode <deterministic|exploratory>
  cdk agent config set provider-strategy <auto|gateway|direct>
  cdk agent config set preserve-deterministic-artifacts <true|false>
  cdk agent config set preserve-deterministic-sections <true|false>
  cdk agent config set exploratory-code-changes <true|false>
  cdk agent config set exploratory-wide-changes <true|false>

This updates the shared repo harness config at ${relativeConfigPath()}.`);
}