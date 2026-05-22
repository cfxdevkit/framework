import { agentToolingNamespace } from './agent-namespace.js';
import type { ToolingNamespaceDefinition } from './contracts.js';
import { repoToolingNamespace } from './repo-namespace.js';

const llmCommands = [
  {
    name: 'models',
    description: 'List models for the resolved LLM provider',
  },
  {
    name: 'model',
    description: 'Interactive default-model picker compatibility command',
  },
  {
    name: 'validate-models',
    description: 'Probe discovered models with cold/hot/json reliability checks',
  },
  {
    name: 'config',
    description: 'Show or update provider-aware LLM config',
  },
  {
    name: 'ask',
    description: 'Ask a repo-aware one-shot question through the current agent stack',
  },
  {
    name: 'actions',
    description: 'List generic repo-aware LLM actions',
  },
  {
    name: 'action',
    description: 'Run a named generic repo-aware LLM action',
    usage: 'action <name> [args]',
  },
  {
    name: 'precommit',
    description: 'Deprecated: use cdk repo precommit',
    hidden: true,
  },
  {
    name: 'commit',
    description: 'Deprecated: use cdk repo commit',
    hidden: true,
  },
  {
    name: 'review',
    description: 'Deprecated: use cdk repo review',
    hidden: true,
  },
  {
    name: 'all',
    description: 'Deprecated: use cdk agent exploratory all',
    hidden: true,
  },
  {
    name: 'docs-api',
    description: 'Deprecated: use cdk agent deterministic docs-api',
    hidden: true,
  },
  {
    name: 'docs-api-probe',
    description: 'Deprecated: use cdk agent deterministic docs-api-probe',
    hidden: true,
  },
  {
    name: 'readme-upkeep',
    description: 'Deprecated: use cdk agent deterministic readme-upkeep',
    hidden: true,
  },
  {
    name: 'package-pages',
    description: 'Deprecated: use cdk agent deterministic package-pages',
    hidden: true,
  },
  {
    name: 'structure-upkeep',
    description: 'Deprecated: use cdk agent deterministic structure-upkeep',
    hidden: true,
  },
  {
    name: 'docs-upkeep',
    description: 'Deprecated: use cdk agent deterministic docs-upkeep',
    hidden: true,
  },
  {
    name: 'test-upkeep',
    description: 'Deprecated: use cdk agent exploratory test-upkeep',
    hidden: true,
  },
  {
    name: 'test-audit',
    description: 'Deprecated: use cdk agent exploratory test-audit',
    hidden: true,
  },
  {
    name: 'health',
    description: 'Deprecated: use cdk agent exploratory health',
    hidden: true,
  },
  {
    name: 'validation',
    description: 'Deprecated: use cdk agent exploratory validation',
    hidden: true,
  },
  {
    name: 'changeset',
    description: 'Deprecated: use cdk agent exploratory changeset',
    hidden: true,
  },
  {
    name: 'release',
    description: 'Deprecated: use cdk agent exploratory release',
    hidden: true,
  },
  {
    name: 'ci-cd',
    description: 'Deprecated: use cdk agent exploratory ci-cd',
    hidden: true,
  },
  {
    name: 'docs-pipeline',
    description: 'Deprecated: use cdk agent exploratory docs-pipeline',
    hidden: true,
  },
] as const;

export const llmToolingNamespace = {
  name: 'llm',
  description: 'Model/provider administration and generic repo-aware LLM utilities',
  commands: llmCommands,
  run: runLlmCli,
} as const satisfies ToolingNamespaceDefinition;

async function runLlmCli(rawArgs: readonly string[]): Promise<void> {
  const args = [...rawArgs];
  while (args[0] === '--') args.shift();

  const [command = 'help', ...rest] = args;
  if (isHelpToken(command)) {
    printLlmHelp();
    return;
  }

  if (command === 'models') {
    await agentToolingNamespace.run(['deterministic', 'models', ...rest]);
    return;
  }

  if (command === 'model') {
    if (isHelpToken(rest[0] ?? '')) {
      printLlmHelp();
      return;
    }
    await agentToolingNamespace.run(['config', 'set', 'default-model', ...rest]);
    return;
  }

  if (command === 'validate-models') {
    await agentToolingNamespace.run(['deterministic', 'validate-models', ...rest]);
    return;
  }

  if (command === 'config') {
    await agentToolingNamespace.run(['config', ...rest]);
    return;
  }

  if (command === 'ask') {
    await agentToolingNamespace.run(['print', ...rest]);
    return;
  }

  if (command === 'actions') {
    await agentToolingNamespace.run(['exploratory', 'actions', ...rest]);
    return;
  }

  if (command === 'action') {
    await agentToolingNamespace.run(['exploratory', 'action', ...rest]);
    return;
  }

  if (command === 'precommit' || command === 'commit' || command === 'review') {
    printDeprecated(`cdk repo ${command}`);
    await repoToolingNamespace.run([command, ...rest]);
    return;
  }

  if (command === 'all') {
    printDeprecated('cdk agent exploratory all');
    await agentToolingNamespace.run(['exploratory', 'all', ...rest]);
    return;
  }

  if (
    command === 'docs-api' ||
    command === 'docs-api-probe' ||
    command === 'readme-upkeep' ||
    command === 'package-pages' ||
    command === 'structure-upkeep' ||
    command === 'docs-upkeep'
  ) {
    printDeprecated(`cdk agent deterministic ${command}`);
    await agentToolingNamespace.run(['deterministic', command, ...rest]);
    return;
  }

  if (
    command === 'test-upkeep' ||
    command === 'test-audit' ||
    command === 'health' ||
    command === 'validation' ||
    command === 'changeset' ||
    command === 'release' ||
    command === 'ci-cd' ||
    command === 'docs-pipeline'
  ) {
    printDeprecated(`cdk agent exploratory ${command}`);
    await agentToolingNamespace.run(['exploratory', command, ...rest]);
    return;
  }

  printLlmHelp();
}

function printLlmHelp(): void {
  console.log(`cdk llm

Usage:
  cdk llm models
  cdk llm model [id]
  cdk llm validate-models [args]
  cdk llm config [show|reset|set ...]
  cdk llm ask -- [prompt]
  cdk llm actions
  cdk llm action <name> [args]

Intent:
  - provider, model, and backend administration belongs here
  - cdk llm model preserves the legacy interactive default-model picker
  - generic repo-aware prompts and named actions belong here
  - repository maintenance flows now live under cdk repo
  - interactive and sessioned agent workflows live under cdk agent`);
}

function printDeprecated(target: string): void {
  console.warn(`Deprecated llm workflow surface. Prefer ${target}.`);
}

function isHelpToken(value: string): boolean {
  return value === 'help' || value === '--help' || value === '-h';
}
