import fs from 'node:fs/promises';
import path from 'node:path';

import { discoverDocsPackages } from '../discover/packages.js';
import { findRepoRoot } from '../workspace.js';
import { captureWorkspacePnpm, runWorkspacePnpm } from './process.js';

export type DocsApiTarget = {
  rel: string;
  name: string;
  apiPath: string;
};

export async function refreshApiSkeletons(options: { repoRoot?: string } = {}): Promise<void> {
  await runWorkspacePnpm(['run', 'gen:api'], options);
}

export async function refreshDocsAlignmentArtifacts(
  options: { repoRoot?: string } = {},
): Promise<string> {
  return captureWorkspacePnpm(['run', 'check:docs'], options);
}

export async function discoverApiTargets(
  options: { repoRoot?: string; packageName?: string } = {},
): Promise<DocsApiTarget[]> {
  const repoRoot = options.repoRoot ?? findRepoRoot();
  const packages = await discoverDocsPackages(repoRoot);
  const results: DocsApiTarget[] = [];

  for (const pkg of packages) {
    if (options.packageName && pkg.name !== options.packageName) continue;
    const apiPath = path.join(repoRoot, pkg.rel, 'API.md');
    try {
      await fs.access(apiPath);
      results.push({ rel: pkg.rel, name: pkg.name, apiPath });
    } catch {
      // Skip packages without API.md after deterministic generation.
    }
  }

  return results.sort((left, right) => left.rel.localeCompare(right.rel));
}
