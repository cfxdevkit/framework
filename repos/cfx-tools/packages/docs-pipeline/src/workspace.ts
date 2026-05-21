import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageDir = dirname(dirname(fileURLToPath(import.meta.url)));

export function findRepoRoot(startDir: string = packageDir): string {
  let current = startDir;
  while (current !== dirname(current)) {
    if (existsSync(join(current, 'pnpm-workspace.yaml')) && existsSync(join(current, 'repos'))) {
      return current;
    }
    current = dirname(current);
  }
  throw new Error(`Unable to find repository root from ${startDir}`);
}

export function getDocsSitePaths(repoRoot: string = findRepoRoot()) {
  const docsSiteDir = join(repoRoot, 'repos/cfx-tools/packages/docs-site');
  const contentDir = join(docsSiteDir, 'content');
  return {
    repoRoot,
    docsSiteDir,
    contentDir,
    packagesContentDir: join(contentDir, 'packages'),
    wikiContentDir: join(contentDir, 'wiki'),
    scriptsDir: join(docsSiteDir, 'scripts'),
    metaFile: join(contentDir, 'packages/_meta.js'),
    indexFile: join(contentDir, 'index.mdx'),
  };
}
