#!/usr/bin/env node
/**
 * generate-structure — Deterministic STRUCTURE.md generator for public packages.
 *
 * Usage:
 *   pnpm exec tsx src/bin/generate-structure.ts [--write] [--check] [--package <name>]
 */
import { readFile, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { discoverPublicPackages } from '../../api/filter.js';
import {
  computeStructureTreeHash,
  embedStructureMetadata,
  readEmbeddedStructureHash,
  renderStructureSkeleton,
  walkStructureTree,
} from '../../api/structure.js';
import { root } from '../../runtime.js';

const args = process.argv.slice(2);
const write = args.includes('--write');
const silent = args.includes('--silent');
const pkgFilter = (() => {
  const index = args.indexOf('--package');
  return index !== -1 ? args[index + 1] : null;
})();

function log(message: string) {
  if (!silent) console.log(message);
}

const packages = await discoverPublicPackages();
const targets = pkgFilter ? packages.filter((pkg) => pkg.name === pkgFilter) : packages;

if (targets.length === 0) {
  if (pkgFilter) {
    console.error(`No public package found with name: ${pkgFilter}`);
    process.exit(1);
  }
  log('No public packages found.');
  process.exit(0);
}

let missingCount = 0;
let staleCount = 0;
let writtenCount = 0;
let upToDateCount = 0;

for (const pkg of targets) {
  const pkgDir = join(root, pkg.rel);
  const treeLines = await walkStructureTree(pkgDir);
  const currentHash = computeStructureTreeHash(treeLines);
  const skeleton = renderStructureSkeleton(pkg, treeLines);
  const deterministicContent = embedStructureMetadata(skeleton, currentHash, {
    needsEnrichment: true,
  });

  let existingContent: string | null = null;
  try {
    await stat(pkg.structureMdPath);
    existingContent = await readFile(pkg.structureMdPath, 'utf8');
  } catch {
    // no STRUCTURE.md yet
  }

  const existingHash = existingContent ? readEmbeddedStructureHash(existingContent) : null;
  const isMissing = existingContent == null;
  const isStale = !isMissing && existingHash !== currentHash;

  if (isMissing) {
    missingCount++;
    log(`  MISSING  ${pkg.rel}`);
  } else if (isStale) {
    staleCount++;
    log(`  STALE    ${pkg.rel} (tree changed or deterministic metadata missing)`);
  } else {
    upToDateCount++;
    continue;
  }

  if (!write) continue;

  await writeFile(pkg.structureMdPath, deterministicContent, 'utf8');
  writtenCount++;
  log(`  WRITTEN  ${pkg.rel}/STRUCTURE.md`);
}

const summary = write
  ? `generate:structure — written: ${writtenCount}, already up-to-date: ${upToDateCount}`
  : `generate:structure — missing: ${missingCount}, stale: ${staleCount}, up-to-date: ${upToDateCount}`;

log(`\n${summary}`);

if (!write && (missingCount > 0 || staleCount > 0)) {
  process.exitCode = 1;
}
