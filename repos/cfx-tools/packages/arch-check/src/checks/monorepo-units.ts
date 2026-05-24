import { join, relative } from 'node:path';
import { findWorkspaceRoot } from '@cfxdevkit/workspace-utils';

type MonorepoUnitSpec = {
  readonly name: string;
  readonly aliases: readonly string[];
  readonly rootDir: string;
  readonly description: string;
  readonly focus: string;
  readonly sessionEffect: string;
  readonly defaultMode: 'deterministic' | 'exploratory';
};

export type MonorepoUnit = MonorepoUnitSpec & {
  readonly rootPath: string;
  readonly relativeRootPath: string;
  readonly configPath: string;
  readonly relativeConfigPath: string;
};

const monorepoUnitSpecs = [
  {
    name: 'delivery',
    aliases: ['docs', 'openspec', 'plan'],
    rootDir: 'openspec',
    description: 'Planning, OpenSpec changes, docs, and delivery artifacts',
    focus: 'OpenSpec-first planning, architecture alignment, docs updates, and delivery validation',
    sessionEffect:
      'Preloads planning, OpenSpec, ADR, and documentation context while keeping the shared monorepo rules and cdk workflows.',
    defaultMode: 'deterministic',
  },
  {
    name: 'implementation',
    aliases: ['repos', 'projects', 'workspaces'],
    rootDir: 'repos',
    description: 'Packages, examples, and workspace code surfaces',
    focus: 'Implementation, refactors, and validation across repos, projects, and workspace code',
    sessionEffect:
      'Preloads package, example, and workspace implementation context for broad code work and maintenance.',
    defaultMode: 'exploratory',
  },
  {
    name: 'operations',
    aliases: ['infrastructure', 'scripts'],
    rootDir: 'infrastructure',
    description: 'Infrastructure, CI, release, and operational automation',
    focus:
      'Operational maintenance for infrastructure, release flow, CI, and repository automation',
    sessionEffect:
      'Preloads infrastructure and automation context for release, CI, and operational workflows.',
    defaultMode: 'exploratory',
  },
] as const satisfies readonly MonorepoUnitSpec[];

export function listMonorepoUnits(startDir: string = process.cwd()): readonly MonorepoUnit[] {
  const repoRoot = findWorkspaceRoot(startDir);
  return monorepoUnitSpecs.map((spec) => {
    const rootPath = join(repoRoot, spec.rootDir);
    const configPath = join(repoRoot, 'artifacts', 'llm', 'config', 'units', `${spec.name}.json`);
    return {
      ...spec,
      rootPath,
      relativeRootPath: relative(startDir, rootPath) || spec.rootDir,
      configPath,
      relativeConfigPath:
        relative(startDir, configPath) || `artifacts/llm/config/units/${spec.name}.json`,
    };
  });
}

export function buildMonorepoUnitConfig(unit: MonorepoUnit) {
  return {
    unit: {
      name: unit.name,
      aliases: unit.aliases,
      rootDir: unit.rootDir,
      description: unit.description,
      focus: unit.focus,
      sessionEffect: unit.sessionEffect,
    },
    harness: {
      defaultMode: unit.defaultMode,
      providerStrategy: 'auto',
    },
  };
}
