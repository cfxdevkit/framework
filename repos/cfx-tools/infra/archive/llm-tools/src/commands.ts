export type LlmWorker = 'llm' | 'deterministic' | 'pi';

export interface LlmCommandDefinition {
  readonly name: string;
  readonly description: string;
  readonly worker: LlmWorker;
  readonly workerArgs: readonly string[];
}

export const llmCommands = [
  {
    name: 'models',
    description: 'List models for the resolved LLM provider',
    worker: 'llm',
    workerArgs: ['models'],
  },
  {
    name: 'validate-models',
    description: 'Probe discovered models with cold/hot/json reliability checks',
    worker: 'llm',
    workerArgs: ['validate-models'],
  },
  {
    name: 'config',
    description: 'Show or update local provider-aware LLM config',
    worker: 'llm',
    workerArgs: ['config'],
  },
  {
    name: 'ask',
    description: 'Ask a repo-aware local LLM question',
    worker: 'pi',
    workerArgs: ['print'],
  },
  {
    name: 'print',
    description: 'Run a one-shot prompt through the PI print runtime',
    worker: 'pi',
    workerArgs: ['print'],
  },
  {
    name: 'interactive',
    description: 'Launch the PI-backed interactive runtime',
    worker: 'pi',
    workerArgs: ['interactive'],
  },
  {
    name: 'rpc',
    description: 'Start the PI-backed RPC runtime',
    worker: 'pi',
    workerArgs: ['rpc'],
  },
  {
    name: 'precommit',
    description: 'Run hotspot + quality gates only — no LLM call, no commit message',
    worker: 'llm',
    workerArgs: ['precommit'],
  },
  {
    name: 'commit',
    description: 'Run the hardened local LLM commit pipeline',
    worker: 'llm',
    workerArgs: ['commit'],
  },
  {
    name: 'action',
    description: 'Run a named delegated LLM action',
    worker: 'llm',
    workerArgs: ['run'],
  },
  {
    name: 'actions',
    description: 'List delegated LLM actions',
    worker: 'llm',
    workerArgs: ['actions'],
  },
  {
    name: 'docs-api',
    description:
      'Generate deterministic API.md skeletons for all public packages, then enrich with LLM descriptions',
    worker: 'llm',
    workerArgs: ['docs-api'],
  },
  {
    name: 'docs-api-probe',
    description:
      'Run a tiny API enrichment probe against one package to validate package discovery, provider reachability, and structured model output',
    worker: 'llm',
    workerArgs: ['docs-api-probe'],
  },
  {
    name: 'readme-upkeep',
    description:
      'Scaffold missing README.md files for all public packages, then enrich placeholders with LLM prose',
    worker: 'llm',
    workerArgs: ['readme-upkeep'],
  },
  {
    name: 'package-pages',
    description:
      'Sync package MDX stubs for the docs-site, then enrich each page with LLM-generated descriptions and code examples',
    worker: 'llm',
    workerArgs: ['package-pages'],
  },
  {
    name: 'structure-upkeep',
    description:
      'Scaffold deterministic STRUCTURE.md files via arch-check, then optionally enrich them with the local LLM',
    worker: 'llm',
    workerArgs: ['structure-upkeep'],
  },
  {
    name: 'docs-upkeep',
    description:
      'Run deterministic docs checks, then delegate doc-maintenance recommendations to the local LLM',
    worker: 'llm',
    workerArgs: ['docs-upkeep'],
  },
  {
    name: 'test-upkeep',
    description:
      'Analyse test coverage per package, identify hotspots, and optionally generate missing test files',
    worker: 'llm',
    workerArgs: ['test-upkeep'],
  },
  {
    name: 'test-audit',
    description:
      'Ask the local LLM to assess whether changed code has useful test and precheck coverage',
    worker: 'llm',
    workerArgs: ['run', 'test-audit'],
  },
  {
    name: 'health',
    description: 'Ask the local LLM for repo health, drift, and automation gaps',
    worker: 'llm',
    workerArgs: ['run', 'repo-health'],
  },
  {
    name: 'validation',
    description: 'Ask the local LLM to choose the minimum useful validation commands',
    worker: 'llm',
    workerArgs: ['run', 'validation'],
  },
  {
    name: 'changeset',
    description: 'Ask the local LLM to review Changeset readiness for changed packages',
    worker: 'llm',
    workerArgs: ['run', 'changeset'],
  },
  {
    name: 'release',
    description: 'Ask the local LLM to review Changesets and npm publish readiness',
    worker: 'llm',
    workerArgs: ['run', 'release-readiness'],
  },
  {
    name: 'ci-cd',
    description: 'Ask the local LLM to review CI/CD workflow and VPS deployment risk',
    worker: 'llm',
    workerArgs: ['run', 'ci-cd'],
  },
  {
    name: 'docs-pipeline',
    description: 'Ask the local LLM to review docs build, wiki sync, image, and deploy flow',
    worker: 'llm',
    workerArgs: ['run', 'docs-pipeline'],
  },
  {
    name: 'all',
    description: 'Run all LLM repo upkeep agents',
    worker: 'deterministic',
    workerArgs: ['all'],
  },
  {
    name: 'review',
    description: 'Run deterministic changed-file review and validation suggestions',
    worker: 'deterministic',
    workerArgs: ['review'],
  },
] as const satisfies readonly LlmCommandDefinition[];

export type LlmCommandName = (typeof llmCommands)[number]['name'];

export function findLlmCommand(name: string): LlmCommandDefinition | undefined {
  return llmCommands.find((command) => command.name === name);
}
