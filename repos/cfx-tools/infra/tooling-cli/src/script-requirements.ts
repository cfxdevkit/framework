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
      name: 'llm:config',
      expected: 'moon run tooling-cli:repo-status',
      severity: 'warning',
      description: 'llm config alias (now via repo:status)',
    },
    {
      name: 'llm:commit',
      expected: 'moon run tooling-cli:repo-precommit',
      severity: 'warning',
      description: 'llm commit alias (now via repo:precommit)',
    },
    {
      name: 'llm:review',
      expected: 'moon run tooling-cli:repo-review',
      severity: 'warning',
      description: 'llm review alias (now via repo:review)',
    },
    {
      name: 'llm:wiki',
      expected: 'moon run tooling-cli:docs-wiki',
      severity: 'warning',
      description: 'deprecated wiki alias routed through docs namespace',
    },
  ];

  for (const action of deterministicActions) {
    entries.push({
      name: `llm:${action}`,
      expected: `moon run tooling-cli:repo-actions --mode deterministic ${action}`,
      severity: 'warning',
      description: `${action} agent alias (now via repo actions)`,
    });
  }

  for (const { action, alias } of exploratoryActions) {
    entries.push({
      name: `llm:${alias ?? action}`,
      expected: `moon run tooling-cli:repo-actions --mode exploratory ${action}`,
      severity: 'warning',
      description: `${action} agent alias (now via repo actions)`,
    });
  }

  return entries;
}

/** Full set of script requirements covering structural + llm:* aliases. */
export function getRootScriptRequirements(): readonly ScriptRequirement[] {
  return getLlmScriptRequirements();
}
