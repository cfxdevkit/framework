import { join } from 'node:path';
import { findWorkspaceRoot } from '@cfxdevkit/workspace-utils';

export function findRepoRoot(startDir?: string): string {
  return findWorkspaceRoot(startDir);
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
