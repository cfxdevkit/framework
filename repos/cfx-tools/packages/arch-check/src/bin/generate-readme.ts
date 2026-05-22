#!/usr/bin/env node
/**
 * generate-readme — Scaffold deterministic README.md sections for public packages.
 *
 * Usage:
 *   pnpm exec tsx src/bin/generate-readme.ts [--write] [--check] [--package <name>]
 *
 * Flags:
 *   --write          Write/create README.md for missing packages; update missing sections
 *   --check          Check mode (default) — report issues only
 *   --package <name> Scope to a single package
 *   --silent         Suppress output
 */
import { readFile, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { discoverPublicPackages } from '../api/filter.js';
import {
  backfillReadmeSections,
  checkReadmeSections,
  computeReadmeSkeletonHash,
  embedReadmeSkeletonHash,
  renderReadmeSkeleton,
} from '../api/readme.js';
import { root } from '../runtime.js';

const args = process.argv.slice(2);
const write = args.includes('--write');
const silent = args.includes('--silent');
const pkgFilter = (() => {
  const i = args.indexOf('--package');
  return i !== -1 ? args[i + 1] : null;
})();

function log(msg: string) {
  if (!silent) console.log(msg);
}

const packages = await discoverPublicPackages();
const targets = pkgFilter ? packages.filter((p) => p.name === pkgFilter) : packages;

let missingCount = 0;
let incompleteCount = 0;
let okCount = 0;
let writtenCount = 0;

for (const pkg of targets) {
  const readmePath = join(root, pkg.rel, 'README.md');

  let existing: string | null = null;
  try {
    await stat(readmePath);
    existing = await readFile(readmePath, 'utf8');
  } catch {
    // no README.md
  }

  if (!existing) {
    missingCount++;
    log(`  MISSING  ${pkg.rel}`);
    if (write) {
      const skeleton = renderReadmeSkeleton(pkg);
      const hash = computeReadmeSkeletonHash(pkg);
      await writeFile(readmePath, embedReadmeSkeletonHash(skeleton, hash), 'utf8');
      writtenCount++;
      log(`  WRITTEN  ${pkg.rel}/README.md`);
    }
    continue;
  }

  const checks = checkReadmeSections(existing);
  const missingKeys = Object.entries(checks)
    .filter(([, ok]) => !ok)
    .map(([k]) => k);

  if (missingKeys.length > 0) {
    incompleteCount++;
    log(`  INCOMPLETE ${pkg.rel} (missing: ${missingKeys.join(', ')})`);
    if (write) {
      const repaired = backfillReadmeSections(existing, pkg);
      const hash = computeReadmeSkeletonHash(pkg);
      await writeFile(readmePath, embedReadmeSkeletonHash(repaired, hash), 'utf8');
      writtenCount++;
      log(`  UPDATED  ${pkg.rel}/README.md`);
    }
  } else {
    okCount++;
  }
}

const summary = write
  ? `generate:readme — written: ${writtenCount}, incomplete: ${incompleteCount}, ok: ${okCount}`
  : `generate:readme — missing: ${missingCount}, incomplete: ${incompleteCount}, ok: ${okCount}`;
log(`\n${summary}`);

if (!write && (missingCount > 0 || incompleteCount > 0)) {
  process.exitCode = 1;
}
