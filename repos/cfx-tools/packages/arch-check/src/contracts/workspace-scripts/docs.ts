import type { ScriptRequirement } from '../workspace.js';

export const rootDocsScriptRequirements: readonly ScriptRequirement[] = [
  {
    name: 'docs',
    expected: 'pnpm run tooling -- docs',
    severity: 'warning',
    description: 'docs namespace compatibility shim',
  },
  {
    name: 'docs:sync',
    expected: 'pnpm run tooling -- docs sync all',
    severity: 'warning',
    description: 'deterministic docs sync alias',
  },
  {
    name: 'docs:validate-wiki',
    expected: 'pnpm run tooling -- docs validate wiki',
    severity: 'warning',
    description: 'wiki validation alias',
  },
  {
    name: 'docs:validate-wiki-fix',
    expected: 'pnpm run tooling -- docs validate wiki-fix',
    severity: 'warning',
    description: 'wiki validation fix alias',
  },
  {
    name: 'docs:wiki',
    expected: 'pnpm run tooling -- docs wiki',
    severity: 'warning',
    description: 'docs wiki sync alias',
  },
  {
    name: 'docs:validate-packages',
    expected: 'pnpm run tooling -- docs validate content',
    severity: 'warning',
    description: 'generated package docs validation alias',
  },
  {
    name: 'sync:packages',
    expected: 'pnpm run tooling -- docs sync packages',
    severity: 'warning',
    description: 'package page sync alias',
  },
  {
    name: 'sync:architecture',
    expected: 'pnpm run tooling -- docs sync architecture',
    severity: 'warning',
    description: 'architecture page sync alias',
  },
  {
    name: 'sync:coverage',
    expected: 'pnpm run tooling -- docs sync coverage',
    severity: 'warning',
    description: 'coverage page sync alias',
  },
  {
    name: 'sync:wiki',
    expected: 'pnpm run tooling -- docs sync wiki',
    severity: 'warning',
    description: 'wiki sync alias',
  },
];
