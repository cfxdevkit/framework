import { existsSync } from 'node:fs';
import { join } from 'node:path';

export function findRepoRoot(startDir: string): string {
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

export function relativeParent(path: string): string {
  const normalized = path.replace(/\\/g, '/');
  const parent = normalized.slice(0, normalized.lastIndexOf('/')) || normalized;
  return parent === normalized ? normalized : parent;
}
