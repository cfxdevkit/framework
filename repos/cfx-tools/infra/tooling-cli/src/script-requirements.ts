/**
 * Generates script requirements for the workspace root package.json.
 *
 * Action names are inlined to avoid a type-checking dependency on
 * @cfxdevkit/llm-agents source files (which use tsx .ts extension imports
 * incompatible with standard tsc). Canonical source: repo-actions.ts in llm-agents.
 */

export type ScriptRequirement = {
  readonly name: string;
  readonly expected: string;
  readonly severity: 'warning' | 'error';
  readonly description: string;
};

const deterministicActions = [
  'docs-api',
  'readme-upkeep',
  'package-pages',
  'structure-upkeep',
  'docs-upkeep',
  'models',
  'validate-models',
] as const;

const exploratoryActions: ReadonlyArray<{ action: string; alias?: string }> = [
  { action: 'validation' },
  { action: 'test-audit' },
  { action: 'repo-health', alias: 'health' },
  { action: 'changeset' },
  { action: 'release-readiness', alias: 'release' },
  { action: 'ci-cd' },
  { action: 'docs-pipeline' },
];

/** Returns script requirements for llm:* aliases derived from the command registry. */
export function getLlmScriptRequirements(): readonly ScriptRequirement[] {
  const entries: ScriptRequirement[] = [
    {
      name: 'llm',
      expected: 'pnpm run agent',
      severity: 'warning',
      description: 'llm namespace compatibility shim',
    },
    {
      name: 'llm:config',
      expected: 'pnpm run cdk -- agent config',
      severity: 'warning',
      description: 'llm config alias',
    },
    {
      name: 'llm:commit',
      expected: 'pnpm run repo:commit',
      severity: 'warning',
      description: 'llm commit alias',
    },
    {
      name: 'llm:review',
      expected: 'pnpm run repo:review',
      severity: 'warning',
      description: 'llm review alias',
    },
    {
      name: 'llm:wiki',
      expected: 'pnpm run docs:wiki',
      severity: 'warning',
      description: 'deprecated wiki alias routed through docs namespace',
    },
    {
      name: 'llm:model',
      expected: 'pnpm run cdk -- agent config set default-model',
      severity: 'warning',
      description: 'interactive default-model alias',
    },
  ];

  for (const action of deterministicActions) {
    entries.push({
      name: `llm:${action}`,
      expected: `pnpm run cdk -- agent deterministic ${action}`,
      severity: 'warning',
      description: `${action} agent alias`,
    });
  }

  for (const { action, alias } of exploratoryActions) {
    entries.push({
      name: `llm:${alias ?? action}`,
      expected: `pnpm run cdk -- agent exploratory ${action}`,
      severity: 'warning',
      description: `${action} agent alias`,
    });
  }

  return entries;
}

/** Full set of script requirements covering structural + llm:* aliases. */
export function getRootScriptRequirements(): readonly ScriptRequirement[] {
  return getLlmScriptRequirements();
}
