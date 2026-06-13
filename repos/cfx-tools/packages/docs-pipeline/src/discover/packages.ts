import fs from 'node:fs/promises';
import path from 'node:path';

import { computeSkeletonHash, toSlug } from '../package/content.js';
import { findRepoRoot } from '../workspace.js';

const SKIP_PACKAGES = new Set([
  '@cfxdevkit/biome-config',
  '@cfxdevkit/tsconfig',
  '@cfxdevkit/moon-config',
  '@cfxdevkit/arch-rules',
  '@cfxdevkit/docs-site',
]);

const REPO_DIRS = [
  'repos/cfx-core',
  'repos/cfx-keys',
  'repos/cfx-ui',
  'repos/cfx-solidity',
  'repos/cfx-tools',
  'repos/cfx-domain',
];

export type DocsPackageRecord = {
  name: string;
  description: string;
  exports: Record<string, unknown>;
  readme: string | null;
  api: string | null;
  rel: string;
};

export type DocsPackagePageRecord = DocsPackageRecord & {
  slug: string;
  skeletonHash: string;
};

async function readJsonFile(filePath: string): Promise<Record<string, unknown> | null> {
  try {
    return JSON.parse(await fs.readFile(filePath, 'utf8')) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function readTextFile(filePath: string): Promise<string | null> {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch {
    return null;
  }
}

export async function discoverDocsPackages(repoRoot: string): Promise<DocsPackageRecord[]> {
  const packages: DocsPackageRecord[] = [];
  for (const repoDir of REPO_DIRS) {
    for (const parent of ['packages', 'infra']) {
      const parentDir = path.join(repoRoot, repoDir, parent);
      let entries: string[];
      try {
        entries = await fs.readdir(parentDir);
      } catch {
        continue;
      }
      for (const entry of entries) {
        const pkgDir = path.join(parentDir, entry);
        const pkgJson = await readJsonFile(path.join(pkgDir, 'package.json'));
        if (!pkgJson || typeof pkgJson.name !== 'string' || pkgJson.private === true) continue;
        const pkgName = pkgJson.name;
        if (SKIP_PACKAGES.has(pkgName)) continue;
        packages.push({
          name: pkgName,
          description: typeof pkgJson.description === 'string' ? pkgJson.description : '',
          exports: (pkgJson.exports as Record<string, unknown> | undefined) ?? {},
          readme: await readTextFile(path.join(pkgDir, 'README.md')),
          api: await readTextFile(path.join(pkgDir, 'API.md')),
          rel: `${repoDir}/${parent}/${entry}`,
        });
      }
    }
  }
  return packages;
}

export async function discoverDocsPagePackages(
  options: { repoRoot?: string; packageName?: string } = {},
): Promise<DocsPackagePageRecord[]> {
  const repoRoot = options.repoRoot ?? findRepoRoot();
  const packages = await discoverDocsPackages(repoRoot);
  return packages
    .filter((pkg) => !options.packageName || pkg.name === options.packageName)
    .map((pkg) => ({
      ...pkg,
      slug: toSlug(pkg.name),
      skeletonHash: computeSkeletonHash(
        pkg.name,
        pkg.description,
        pkg.exports,
        pkg.readme,
        pkg.api,
      ),
    }));
}
