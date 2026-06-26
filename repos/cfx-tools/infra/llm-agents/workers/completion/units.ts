import { join, relative } from 'node:path';
import { root } from '../shared/index.js';
import type { MonorepoUnit } from './types.js';
import { monorepoUnitSpecs } from './types.js';

export function findMonorepoUnitByConfigPath(
  configFilePath: string,
  startDir: string = process.cwd(),
): MonorepoUnit | undefined {
  const normalized = normalizePath(configFilePath);
  const directMatch = listMonorepoUnits(startDir).find(
    (unit) => normalizePath(unit.configPath) === normalized,
  );
  if (directMatch) {
    return directMatch;
  }

  const fileName = normalized
    .split('/')
    .at(-1)
    ?.replace(/\.json$/i, '');
  if (!fileName) {
    return undefined;
  }

  return listMonorepoUnits(startDir).find(
    (unit) => unit.name === fileName || unit.relativeRootPath === fileName,
  );
}

function listMonorepoUnits(startDir: string = process.cwd()): readonly MonorepoUnit[] {
  return monorepoUnitSpecs.map((spec) => {
    const rootPath = join(root, spec.rootDir);
    const unitConfigPath = join(root, 'artifacts', 'llm', 'config', 'units', `${spec.name}.json`);
    return {
      name: spec.name,
      rootDir: spec.rootDir,
      description: spec.description,
      focus: spec.focus,
      defaultMode: spec.defaultMode,
      rootPath,
      relativeRootPath: relative(startDir, rootPath) || spec.rootDir,
      configPath: unitConfigPath,
      relativeConfigPath:
        relative(startDir, unitConfigPath) || `artifacts/llm/config/units/${spec.name}.json`,
    };
  });
}

function normalizePath(path: string): string {
  return path.replace(/\\/g, '/');
}
