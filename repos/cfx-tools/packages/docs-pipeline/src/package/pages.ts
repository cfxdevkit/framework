import fs from 'node:fs/promises';

import { type DocsPackageRecord, discoverDocsPackages } from '../discover/packages.js';
import {
  computeSkeletonHash,
  embedHash,
  extractDescription,
  generateMdxSkeleton,
  isValidGeneratedMdx,
  readEmbeddedHash,
  toSlug,
} from '../package/content.js';
import { getDocsSitePaths } from '../workspace.js';

export type SyncPackagesResult = {
  packageCount: number;
  created: number;
  updated: number;
};

async function readTextFile(filePath: string): Promise<string | null> {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch {
    return null;
  }
}

async function syncPackagePage(
  pkg: DocsPackageRecord,
  packagesContentDir: string,
): Promise<{ slug: string; name: string; created: boolean; updated: boolean }> {
  const slug = toSlug(pkg.name);
  const destPath = `${packagesContentDir}/${slug}.mdx`;
  const hash = computeSkeletonHash(pkg.name, pkg.description, pkg.exports, pkg.readme, pkg.api);
  const existing = await readTextFile(destPath);
  const description = extractDescription(pkg.readme, pkg.description);

  if (!existing) {
    const content = embedHash(generateMdxSkeleton({ ...pkg, description }), hash);
    await fs.writeFile(destPath, content, 'utf8');
    console.log(`  created ${slug}.mdx`);
    return { slug, name: pkg.name, created: true, updated: false };
  }

  const embeddedHash = readEmbeddedHash(existing);
  const hasStaleContent = /<!--/.test(existing) || /\{@link\s/.test(existing);
  const hasValidMdx = await isValidGeneratedMdx(existing);
  if (embeddedHash === hash && !hasStaleContent && hasValidMdx) {
    return { slug, name: pkg.name, created: false, updated: false };
  }

  const content = embedHash(generateMdxSkeleton({ ...pkg, description }), hash);
  await fs.writeFile(destPath, content, 'utf8');
  const reason = !hasValidMdx ? 'invalid mdx repaired' : 'skeleton changed';
  console.log(`  updated  ${slug}.mdx (${reason})`);
  return { slug, name: pkg.name, created: false, updated: true };
}

async function updateMetaFile(
  entries: Array<{ slug: string; name: string }>,
  metaFile: string,
): Promise<void> {
  const sorted = [...entries].sort((left, right) => left.slug.localeCompare(right.slug));
  const lines = sorted.map((entry) => `  '${entry.slug}': '${entry.name}',`).join('\n');
  const content = `// biome-ignore lint: Nextra requires default export for meta files
export default {
  index: 'Overview',
${lines}
};\n`;
  await fs.writeFile(metaFile, content, 'utf8');
  console.log(`  updated  _meta.js (${sorted.length} packages)`);
}

async function syncIndexCards(packages: DocsPackageRecord[], indexFile: string): Promise<void> {
  let content: string;
  try {
    content = await fs.readFile(indexFile, 'utf8');
  } catch {
    return;
  }

  const nameToSlug = new Map(packages.map((pkg) => [pkg.name, toSlug(pkg.name)]));
  const fixed = content.replace(
    /(<Cards\.Card title="(@cfxdevkit\/[^"]+)"[^>]+href=")\/packages\/[^"]+("|[^>]*\/?>)/g,
    (match, pre: string, pkgName: string, post: string) => {
      const slug = nameToSlug.get(pkgName);
      return slug ? `${pre}/packages/${slug}${post}` : match;
    },
  );

  if (fixed !== content) {
    await fs.writeFile(indexFile, fixed, 'utf8');
    console.log('  updated  index.mdx (fixed Cards.Card hrefs)');
  }
}

export async function syncPackages(): Promise<SyncPackagesResult> {
  const { repoRoot, packagesContentDir, metaFile, indexFile } = getDocsSitePaths();
  await fs.mkdir(packagesContentDir, { recursive: true });

  console.log('sync-packages: discovering public packages...');
  const packages = await discoverDocsPackages(repoRoot);
  console.log(`  found ${packages.length} packages\n`);

  const entries: Array<{ slug: string; name: string }> = [];
  let created = 0;
  let updated = 0;

  for (const pkg of packages) {
    const result = await syncPackagePage(pkg, packagesContentDir);
    entries.push({ slug: result.slug, name: result.name });
    if (result.created) created++;
    if (result.updated) updated++;
  }

  await updateMetaFile(entries, metaFile);
  await syncIndexCards(packages, indexFile);
  console.log(`\nDone — synced ${packages.length} package pages.`);

  return { packageCount: packages.length, created, updated };
}
