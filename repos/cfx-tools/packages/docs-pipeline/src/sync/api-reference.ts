import fs from 'node:fs/promises';
import path from 'node:path';

import { discoverDocsPackages } from '../discover/packages.js';
import { toSlug } from '../package/content.js';
import { findRepoRoot, getDocsSitePaths } from '../workspace.js';

/**
 * Sync API reference page from all package exports.
 *
 * Aggregates exports across all publishable packages into a single
 * navigable page. Groups packages by tier (framework / platform / domain).
 *
 * Outputs: content/api.mdx
 */

type Tier = {
  name: string;
  tier: number;
  packages: Array<{ name: string; slug: string; exports: Record<string, unknown> }>;
};

/**
 * Determine the tier for a package based on its repository location.
 */
function getTier(repoDir: string, _relPath: string): number {
  // Tier 0: core framework packages
  if (
    repoDir === 'repos/cfx-core' ||
    repoDir === 'repos/cfx-keys' ||
    repoDir === 'repos/cfx-ui' ||
    repoDir === 'repos/cfx-solidity'
  ) {
    return 0;
  }
  // Tier 1: developer platform
  if (repoDir === 'repos/cfx-tools') {
    return 1;
  }
  // Tier 2: domain logic
  if (repoDir === 'repos/cfx-domain') {
    return 2;
  }
  return 0;
}

/**
 * Get the human-readable tier label.
 */
function getTierLabel(tier: number): string {
  switch (tier) {
    case 0:
      return 'Tier 0 — Framework';
    case 1:
      return 'Tier 1 — Developer Platform';
    case 2:
      return 'Tier 2 — Domain Logic';
    default:
      return 'Tier ?';
  }
}

/**
 * Build sub-paths table rows for a package's exports.
 */
function buildSubPathsTable(name: string, exports: Record<string, unknown>): string {
  const subpaths = Object.keys(exports).filter((key) => key !== './package.json');
  if (subpaths.length === 0) return '';

  const rows = subpaths
    .sort()
    .map((key) => {
      const importPath = key === '.' ? name : `${name}${key.slice(1)}`;
      return `| \`${importPath}\` | — |`;
    })
    .join('\n');

  return `
## Sub-paths

| Import | Contents |
|--------|---------|
${rows}`;
}

/**
 * Render a single package section for the API reference.
 */
function renderPackageSection(
  name: string,
  description: string,
  exports: Record<string, unknown>,
): string {
  const slug = toSlug(name);
  const subPaths = buildSubPathsTable(name, exports);

  return `### [${name}](/packages/${slug})

${description}

${subPaths}
`;
}

/**
 * Build the summary table for the API reference page.
 */
function buildSummaryTable(tiers: Tier[]): string {
  const rows = tiers.flatMap((tier) =>
    tier.packages.map((pkg) => {
      const exportCount = Object.keys(pkg.exports).filter((k) => k !== './package.json').length;
      return `| [${pkg.name}](/packages/${toSlug(pkg.name)}) | ${exportCount} | ${tier.tier} |`;
    }),
  );

  return `| Package | Exports | Tier |
|---|---|---|
${rows.join('\n')}`;
}

/**
 * Generate the full API reference MDX.
 */
function renderApiReference(tiers: Tier[]): string {
  const summaryTable = buildSummaryTable(tiers);

  const packageSections = tiers.flatMap((tier) =>
    tier.packages.map((pkg) =>
      renderPackageSection(
        pkg.name,
        'See [package page](/packages/${toSlug(pkg.name)})',
        pkg.exports,
      ),
    ),
  );

  return `---
title: "API Reference"
description: "Public API surfaces for all @cfxdevkit packages"
---

import { Callout } from 'nextra/components'

# API Reference

Public API surfaces for all \`@cfxdevkit\` packages. Each package exposes an \`exports\` map in \`package.json\` that defines its public sub-paths.

<Callout type="info">
  This page is auto-generated from package \`exports\` maps. Run \`pnpm sync:api\` to update.
</Callout>

## Summary

${summaryTable}

## Package Details

${packageSections.join('\n\n')}
`;
}

export async function syncApiReference(): Promise<number> {
  const repoRoot = findRepoRoot();
  const { contentDir } = getDocsSitePaths(repoRoot);
  const dest = path.join(contentDir, 'api.mdx');

  console.log('sync-api-reference: discovering packages...');

  const packages = await discoverDocsPackages(repoRoot);
  console.log(`  found ${packages.length} packages`);

  // Group by tier
  const tierMap = new Map<number, Tier>();

  for (const pkg of packages) {
    const tier = getTier(pkg.rel?.split('/')[0] ?? '', pkg.rel ?? '');
    if (!tierMap.has(tier)) {
      tierMap.set(tier, { name: getTierLabel(tier), tier, packages: [] });
    }
    tierMap.get(tier)!.packages.push({
      name: pkg.name,
      slug: toSlug(pkg.name),
      exports: pkg.exports,
    });
  }

  // Sort tiers and packages within each tier
  const tiers = [...tierMap.values()].sort((a, b) => a.tier - b.tier);
  for (const tier of tiers) {
    tier.packages.sort((a, b) => a.name.localeCompare(b.name));
  }

  const mdx = renderApiReference(tiers);
  await fs.writeFile(dest, mdx, 'utf8');
  console.log(`sync-api-reference: wrote content/api.mdx (${packages.length} packages)`);

  return packages.length;
}
