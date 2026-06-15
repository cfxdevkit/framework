import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

/**
 * Walks up from `startDir` (default: `process.cwd()`) looking for the
 * pnpm workspace root (directory containing both `pnpm-workspace.yaml`
 * and `package.json`).
 *
 * Throws if the root cannot be found — this is always a configuration error.
 */
export function findWorkspaceRoot(startDir: string = process.cwd()): string {
  let current = startDir;
  while (true) {
    if (
      existsSync(join(current, 'pnpm-workspace.yaml')) &&
      existsSync(join(current, 'package.json'))
    ) {
      return current;
    }
    const parent = dirname(current);
    if (parent === current) {
      throw new Error(
        `Cannot find workspace root from "${startDir}". ` +
          'Expected a directory containing both pnpm-workspace.yaml and package.json.',
      );
    }
    current = parent;
  }
}
