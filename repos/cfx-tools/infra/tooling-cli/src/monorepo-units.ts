import { join, relative } from 'node:path';
import { findRepoRoot } from './workspace-paths.js';

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

export function findMonorepoUnit(
  name: string,
  startDir: string = process.cwd(),
): MonorepoUnit | undefined {
  return listMonorepoUnits(startDir).find(
    (unit) => unit.name === name || unit.relativeRootPath === name,
  );
}

export function findMonorepoUnitByConfigPath(
  configPath: string,
  startDir: string = process.cwd(),
): MonorepoUnit | undefined {
  const normalized = configPath.replace(/\\/g, '/');
  return listMonorepoUnits(startDir).find(
    (unit) => unit.configPath.replace(/\\/g, '/') === normalized,
  );
}

export function resolveAgentConfigPath(
  scope: string | undefined,
  startDir: string = process.cwd(),
): string {
  if (!scope) {
    return join(findRepoRoot(startDir), 'artifacts', 'llm', 'config', 'llm.json');
  }

  const unit = findMonorepoUnit(scope, startDir);
  if (!unit) {
    throw new Error(`Unknown monorepo unit: ${scope}`);
  }

  return unit.configPath;
}

export function relativeAgentConfigPath(
  scope: string | undefined,
  startDir: string = process.cwd(),
): string {
  const configPath = resolveAgentConfigPath(scope, startDir);
  return relative(startDir, configPath) || 'artifacts/llm/config/llm.json';
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

export function renderMonorepoUnitConfig(unit: MonorepoUnit): string {
  return `${JSON.stringify(buildMonorepoUnitConfig(unit), null, 2)}\n`;
}

export function parseScopeFlag(rawArgs: readonly string[]): {
  readonly args: readonly string[];
  readonly scope?: string;
} {
  const args: string[] = [];
  let scope: string | undefined;
  let passthrough = false;

  for (let index = 0; index < rawArgs.length; index++) {
    const arg = rawArgs[index];
    if (!arg) continue;
    if (passthrough) {
      args.push(arg);
      continue;
    }
    if (arg === '--') {
      passthrough = true;
      args.push(arg);
      continue;
    }
    if (arg === '--scope') {
      const value = rawArgs[index + 1];
      if (!value || value === '--') {
        throw new Error('--scope requires a monorepo unit name');
      }
      scope = value;
      index += 1;
      continue;
    }
    args.push(arg);
  }

  return { args, ...(scope ? { scope } : {}) };
}
