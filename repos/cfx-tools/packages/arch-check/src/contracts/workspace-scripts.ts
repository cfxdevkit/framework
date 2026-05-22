import type { ScriptRequirement } from './workspace.js';
import { rootDocsScriptRequirements } from './workspace-scripts-docs.js';
import { rootLlmScriptRequirements } from './workspace-scripts-llm.js';
import { rootRepoScriptRequirements } from './workspace-scripts-repo.js';

const rootGenerationScriptRequirements: readonly ScriptRequirement[] = [
  {
    name: 'gen:api',
    expected: 'moon run arch-check:generate-api',
    severity: 'warning',
    description: 'deterministic API.md generator',
  },
  {
    name: 'gen:readme',
    expected: 'moon run arch-check:generate-readme',
    severity: 'warning',
    description: 'deterministic README.md generator',
  },
  {
    name: 'gen:structure',
    expected: 'moon run arch-check:generate-structure',
    severity: 'warning',
    description: 'deterministic STRUCTURE.md generator',
  },
  {
    name: 'gen:unit-configs',
    expected: 'moon run arch-check:generate-unit-configs',
    severity: 'warning',
    description: 'deterministic monorepo unit config scaffold generator',
  },
];

export const rootToolingScriptRequirements: readonly ScriptRequirement[] = [
  ...rootGenerationScriptRequirements,
  ...rootRepoScriptRequirements,
  ...rootDocsScriptRequirements,
  ...rootLlmScriptRequirements,
];
