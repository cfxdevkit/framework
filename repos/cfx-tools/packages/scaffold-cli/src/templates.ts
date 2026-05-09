export type { TemplateDefinition, TemplateFile, TemplateTarget } from './templates/types.js';

import { MINIMAL_DAPP } from './templates/minimal-dapp.js';
import { PROJECT_EXAMPLE } from './templates/project-example.js';
import type { TemplateDefinition, TemplateFile, TemplateTarget } from './templates/types.js';
import { WALLET_PROBE } from './templates/wallet-probe.js';

/** @deprecated Use `minimal-dapp`. Kept for backward-compat. */
const BASIC: TemplateDefinition = {
  name: 'basic',
  description: 'Basic template (alias for minimal-dapp).',
  files: MINIMAL_DAPP.files,
  ...(MINIMAL_DAPP.targets !== undefined ? { targets: MINIMAL_DAPP.targets } : {}),
};

const templates: TemplateDefinition[] = [
  MINIMAL_DAPP,
  WALLET_PROBE,
  PROJECT_EXAMPLE,
  BASIC,
  {
    name: 'react',
    description: 'React template (alias for minimal-dapp).',
    files: MINIMAL_DAPP.files,
  },
  {
    name: 'solidity',
    description: 'Solidity template (alias for project-example contracts).',
    files: PROJECT_EXAMPLE.files,
  },
];

export function listTemplates(): TemplateDefinition[] {
  return templates.map((t) => ({ ...t, files: [...t.files] }));
}

export function getTemplate(name: string): TemplateDefinition | undefined {
  const template = templates.find((item) => item.name === name);
  return template ? { ...template, files: [...template.files] } : undefined;
}

export function renderFile(content: string, values: Record<string, string>): string {
  return content.replace(/\{\{([a-zA-Z0-9_-]+)\}\}/g, (match, key: string) => values[key] ?? match);
}

export function getTemplateFiles(
  template: TemplateDefinition,
  target: TemplateTarget = 'default',
): TemplateFile[] {
  const base = [...template.files];
  const extra = template.targets?.[target] ?? [];
  return [...base, ...extra];
}
