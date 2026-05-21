import { join } from 'node:path';

import { discoverDocsPagePackages, type DocsPackagePageRecord } from '../discover-packages.js';
import { embedHash, readEmbeddedHash, stripEmbeddedHash } from '../package-content.js';
import { syncPackages, type SyncPackagesResult } from '../package-pages.js';
import { getDocsSitePaths } from '../workspace.js';

export type PackagePageTarget = DocsPackagePageRecord;

export async function syncPackagePageSkeletons(): Promise<SyncPackagesResult> {
  return syncPackages();
}

export async function discoverPackagePageTargets(
  options: { repoRoot?: string; packageName?: string } = {},
): Promise<PackagePageTarget[]> {
  return discoverDocsPagePackages(options);
}

export function getPackagePagePath(
  target: Pick<PackagePageTarget, 'slug'>,
  repoRoot?: string,
): string {
  const { packagesContentDir } = getDocsSitePaths(repoRoot);
  return join(packagesContentDir, `${target.slug}.mdx`);
}

export function readPackagePageHash(content: string): string | null {
  return readEmbeddedHash(content);
}

export function writePackagePageHash(content: string, hash: string): string {
  return embedHash(content, hash);
}

export function stripPackagePageHash(content: string): string {
  return stripEmbeddedHash(content);
}
