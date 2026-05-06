export type LlmWorker = 'lemonade' | 'deterministic' | 'hotspots';

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
    workerArgs: ['docs-upkeep'],
  },
  {
    name: 'test-upkeep',
    description:
      'Analyse test coverage per package, identify hotspots, and optionally generate missing test files',
    worker: 'lemonade',
    workerArgs: ['test-upkeep'],
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
    name: 'changeset',
    description: 'Ask the local LLM to review Changeset readiness for changed packages',
    worker: 'lemonade',
    workerArgs: ['run', 'changeset'],
  },
  {
    name: 'release',
    description: 'Ask the local LLM to review Changesets and npm publish readiness',
    worker: 'lemonade',
    workerArgs: ['run', 'release-readiness'],
  },
  {
    name: 'ci-cd',
    description: 'Ask the local LLM to review CI/CD workflow and VPS deployment risk',
    worker: 'lemonade',
    workerArgs: ['run', 'ci-cd'],
  },
  {
    name: 'docs-pipeline',
    description: 'Ask the local LLM to review docs build, wiki sync, image, and deploy flow',
    worker: 'lemonade',
    workerArgs: ['run', 'docs-pipeline'],
  },
  {
    name: 'all',
    description: 'Run all deterministic repo upkeep agents',
    worker: 'deterministic',
    workerArgs: ['all'],
  },
  {
    name: 'ci',
    description: 'Run deterministic CI/CD and docs deploy readiness checks',
    worker: 'deterministic',
    workerArgs: ['ci'],
  },
  {
    name: 'corpus',
    description: 'Build local repo corpus metadata for LLM context',
    worker: 'deterministic',
    workerArgs: ['corpus'],
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
    name: 'hotspots',
    description: 'Scan source file sizes and churn against the framework budget',
    worker: 'hotspots',
    workerArgs: [],
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
