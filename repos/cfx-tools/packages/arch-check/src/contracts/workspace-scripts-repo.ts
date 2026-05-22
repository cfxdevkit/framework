import type { ScriptRequirement } from './workspace.js';

export const rootRepoScriptRequirements: readonly ScriptRequirement[] = [
  {
    name: 'tooling',
    expected: 'pnpm --filter @cfxdevkit/tooling-cli tooling --',
    severity: 'warning',
    description: 'canonical root tooling dispatcher',
  },
  {
    name: 'cdk',
    expected: 'pnpm run tooling --',
    severity: 'warning',
    description: 'preferred root control-plane alias',
  },
  {
    name: 'repo',
    expected: 'pnpm run cdk -- repo',
    severity: 'warning',
    description: 'repo namespace compatibility shim',
  },
  {
    name: 'repo:check',
    expected: 'pnpm run cdk -- repo check',
    severity: 'warning',
    description: 'repo validation alias',
  },
  {
    name: 'repo:generate',
    expected: 'pnpm run cdk -- repo generate',
    severity: 'warning',
    description: 'repo generation alias',
  },
  {
    name: 'repo:arch-check',
    expected: 'pnpm run cdk -- repo arch-check',
    severity: 'warning',
    description: 'repo arch-check alias',
  },
  {
    name: 'repo:review',
    expected: 'pnpm run cdk -- repo review',
    severity: 'warning',
    description: 'repo review alias',
  },
  {
    name: 'repo:precommit',
    expected: 'pnpm run cdk -- repo precommit',
    severity: 'warning',
    description: 'repo precommit alias',
  },
  {
    name: 'repo:commit',
    expected: 'pnpm run cdk -- repo commit',
    severity: 'warning',
    description: 'repo commit alias',
  },
  {
    name: 'agent',
    expected: 'pnpm run cdk -- agent',
    severity: 'warning',
    description: 'agent namespace compatibility shim',
  },
  {
    name: 'agent:config',
    expected: 'pnpm run cdk -- agent config',
    severity: 'warning',
    description: 'shared agent harness config alias',
  },
  {
    name: 'agent:status',
    expected: 'pnpm run cdk -- agent status',
    severity: 'warning',
    description: 'agent backend status alias',
  },
  {
    name: 'agent:modes',
    expected: 'pnpm run cdk -- agent modes',
    severity: 'warning',
    description: 'agent modality summary alias',
  },
  {
    name: 'agent:providers',
    expected: 'pnpm run cdk -- agent providers',
    severity: 'warning',
    description: 'agent provider strategy alias',
  },
];
