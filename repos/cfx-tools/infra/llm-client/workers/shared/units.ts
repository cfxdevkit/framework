import { existsSync } from 'node:fs';
import { join, relative } from 'node:path';

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
    focus: 'Operational maintenance for infrastructure, release flow, CI, and repository automation',
    sessionEffect:
      'Preloads infrastructure and automation context for release, CI, and operational workflows.',
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
    (unit) => unit.name === name || unit.aliases.includes(name) || unit.relativeRootPath === name,
  );
}

export function findMonorepoUnitByConfigPath(
  configPath: string,
  startDir: string = process.cwd(),
): MonorepoUnit | undefined {
  const normalized = configPath.replace(/\\/g, '/');
  const directMatch = listMonorepoUnits(startDir).find(
    (unit) => unit.configPath.replace(/\\/g, '/') === normalized,
  );
  if (directMatch) {
    return directMatch;
  }

  const fileName = normalized.split('/').at(-1)?.replace(/\.json$/i, '');
  return fileName ? findMonorepoUnit(fileName, startDir) : undefined;
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
    throw new Error(`Unknown agent scope preset: ${scope}`);
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

export function renderMonorepoUnitConfig(unit: MonorepoUnit): string {
  return `${JSON.stringify(buildMonorepoUnitConfig(unit), null, 2)}\n`;
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
