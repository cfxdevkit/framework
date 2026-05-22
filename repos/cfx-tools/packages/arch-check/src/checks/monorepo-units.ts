import { existsSync } from 'node:fs';
import { join, relative } from 'node:path';

type MonorepoUnitSpec = {
  readonly name: string;
  readonly rootDir: string;
  readonly description: string;
  readonly focus: string;
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
    name: 'docs',
    rootDir: 'docs',
    description: 'Documentation, ADRs, architecture notes, and operator guidance',
    focus: 'deterministic docs enrichment and contract alignment',
    defaultMode: 'deterministic',
  },
  {
    name: 'infrastructure',
    rootDir: 'infrastructure',
    description: 'Deployment, automation, and environment orchestration',
    focus: 'exploratory infra maintenance and operational review',
    defaultMode: 'exploratory',
  },
  {
    name: 'openspec',
    rootDir: 'openspec',
    description: 'Specs, changes, and requirement-level planning artifacts',
    focus: 'deterministic spec upkeep and proposal shaping',
    defaultMode: 'deterministic',
  },
  {
    name: 'plan',
    rootDir: 'plan',
    description: 'Roadmaps, migration phases, and delivery sequencing',
    focus: 'deterministic planning and audit-oriented upkeep',
    defaultMode: 'deterministic',
  },
  {
    name: 'projects',
    rootDir: 'projects',
    description: 'Example apps and project-level integration surfaces',
    focus: 'exploratory app and integration maintenance',
    defaultMode: 'exploratory',
  },
  {
    name: 'repos',
    rootDir: 'repos',
    description: 'Primary packages, infrastructure packages, and code generation owners',
    focus: 'exploratory code maintenance across the main monorepo packages',
    defaultMode: 'exploratory',
  },
  {
    name: 'scripts',
    rootDir: 'scripts',
    description: 'Root automation helpers and publication tooling',
    focus: 'exploratory automation upkeep and validation flow cleanup',
    defaultMode: 'exploratory',
  },
  {
    name: 'workspaces',
    rootDir: 'workspaces',
    description: 'Workspace-level integration roots and supporting top-level surfaces',
    focus: 'exploratory workspace orchestration and integration review',
    defaultMode: 'exploratory',
  },
] as const satisfies readonly MonorepoUnitSpec[];

export function listMonorepoUnits(startDir: string = process.cwd()): readonly MonorepoUnit[] {
  const repoRoot = findRepoRoot(startDir);
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
      rootDir: unit.rootDir,
      description: unit.description,
      focus: unit.focus,
    },
    harness: {
      defaultMode: unit.defaultMode,
      providerStrategy: 'auto',
    },
  };
}

function findRepoRoot(startDir: string): string {
  let current = startDir;
  while (current !== relativeParent(current)) {
    if (
      existsSync(join(current, 'pnpm-workspace.yaml')) &&
      existsSync(join(current, 'package.json'))
    ) {
      return current;
    }
    current = relativeParent(current);
  }
  return startDir;
}

function relativeParent(path: string): string {
  const normalized = path.replace(/\\/g, '/');
  const parent = normalized.slice(0, normalized.lastIndexOf('/')) || normalized;
  return parent === normalized ? normalized : parent;
}
