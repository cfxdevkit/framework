export type LlmWorker = 'lemonade' | 'deterministic';

export interface LlmCommandDefinition {
  readonly name: string;
  readonly description: string;
  readonly worker: LlmWorker;
  readonly workerArgs: readonly string[];
}

export const llmCommands = [
  {
    name: 'models',
    description: 'List auto-discovered Lemonade models',
    worker: 'lemonade',
    workerArgs: ['models'],
  },
  {
    name: 'config',
    description: 'Show or update local Lemonade config',
    worker: 'lemonade',
    workerArgs: ['config'],
  },
  {
    name: 'ask',
    description: 'Ask a repo-aware local LLM question',
    worker: 'lemonade',
    workerArgs: ['ask'],
  },
  {
    name: 'commit',
    description: 'Run the hardened local LLM commit pipeline',
    worker: 'lemonade',
    workerArgs: ['commit'],
  },
  {
    name: 'action',
    description: 'Run a named delegated Lemonade/Pi action',
    worker: 'lemonade',
    workerArgs: ['run'],
  },
  {
    name: 'actions',
    description: 'List delegated Lemonade/Pi actions',
    worker: 'lemonade',
    workerArgs: ['actions'],
  },
  {
    name: 'docs-upkeep',
    description:
      'Run deterministic docs checks, then delegate doc-maintenance recommendations to the local LLM',
    worker: 'lemonade',
    workerArgs: ['run', 'docs-upkeep'],
  },
  {
    name: 'test-audit',
    description:
      'Ask the local LLM to assess whether changed code has useful test and precheck coverage',
    worker: 'lemonade',
    workerArgs: ['run', 'test-audit'],
  },
  {
    name: 'health',
    description: 'Ask the local LLM for repo health, drift, and automation gaps',
    worker: 'lemonade',
    workerArgs: ['run', 'repo-health'],
  },
  {
    name: 'validation',
    description: 'Ask the local LLM to choose the minimum useful validation commands',
    worker: 'lemonade',
    workerArgs: ['run', 'validation'],
  },
  {
    name: 'plan',
    description: 'Ask the local LLM for a repo-aware implementation plan',
    worker: 'lemonade',
    workerArgs: ['run', 'plan'],
  },
  {
    name: 'architecture',
    description: 'Ask the local LLM architecture questions with repo context',
    worker: 'lemonade',
    workerArgs: ['run', 'architecture'],
  },
  {
    name: 'all',
    description: 'Run all deterministic repo upkeep agents',
    worker: 'deterministic',
    workerArgs: ['all'],
  },
  {
    name: 'corpus',
    description: 'Build local repo corpus metadata for LLM context',
    worker: 'deterministic',
    workerArgs: ['corpus'],
  },
  {
    name: 'datasets',
    description: 'Build deterministic eval seed data, not training data',
    worker: 'deterministic',
    workerArgs: ['datasets'],
  },
  {
    name: 'docs',
    description: 'Run deterministic documentation alignment checks',
    worker: 'deterministic',
    workerArgs: ['docs'],
  },
  {
    name: 'eval',
    description: 'Summarize deterministic agent gates',
    worker: 'deterministic',
    workerArgs: ['eval'],
  },
  {
    name: 'review',
    description: 'Run deterministic changed-file review and validation suggestions',
    worker: 'deterministic',
    workerArgs: ['review'],
  },
  {
    name: 'serve-check',
    description: 'Check Lemonade Server reachability',
    worker: 'deterministic',
    workerArgs: ['serve-check'],
  },
] as const satisfies readonly LlmCommandDefinition[];

export type LlmCommandName = (typeof llmCommands)[number]['name'];

export function findLlmCommand(name: string): LlmCommandDefinition | undefined {
  return llmCommands.find((command) => command.name === name);
}
