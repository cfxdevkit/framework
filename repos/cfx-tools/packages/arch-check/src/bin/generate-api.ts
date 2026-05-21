#!/usr/bin/env node
/**
 * generate-api — Deterministic API.md generator for public packages.
 *
 * Usage:
 *   pnpm exec tsx src/bin/generate-api.ts [--write] [--check] [--package <name>]
 *
 * Flags:
 *   --write          Write/overwrite API.md for stale or missing packages (default: check only)
 *   --check          Check mode (default) — report stale/missing, exit 1 if any found
 *   --package <name> Scope to a single package by name (e.g. @cfxdevkit/cdk)
 *   --silent         Suppress console output
 */
import { readFile, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { extractSubpathExports } from '../api/extract.js';
import { discoverPublicPackages } from '../api/filter.js';
import { computeApiHash, embedHash, readApiMdHash } from '../api/hash.js';
import { renderApiMd } from '../api/render.js';

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

if (targets.length === 0) {
  if (pkgFilter) {
    console.error(`No public package found with name: ${pkgFilter}`);
    process.exit(1);
  }
  log('No public packages found.');
  process.exit(0);
}

let staleCount = 0;
let writtenCount = 0;
let missingCount = 0;
let upToDateCount = 0;

for (const pkg of targets) {
  const { name, description, subpaths, distDir, apiMdPath, rel } = pkg;

  // Compute hash of all subpath .d.ts contents
  const dtsContents: string[] = [];
  for (const [, dtsRelative] of Object.entries(subpaths)) {
    const fullPath = join(distDir, dtsRelative);
    try {
      dtsContents.push(await readFile(fullPath, 'utf8'));
    } catch {
      dtsContents.push('');
    }
  }
  const currentHash = computeApiHash(dtsContents);

  // Check existing API.md
  let existingHash: string | null = null;
  let apiMdExists = false;
  try {
    await stat(apiMdPath);
    apiMdExists = true;
    existingHash = await readApiMdHash(apiMdPath);
  } catch {
    // no API.md
  }

  const isMissing = !apiMdExists;
  const isStale = apiMdExists && existingHash !== currentHash;

  if (isMissing) {
    missingCount++;
    log(`  MISSING  ${rel}`);
  } else if (isStale) {
    staleCount++;
    log(`  STALE    ${rel} (hash changed)`);
  } else {
    upToDateCount++;
    continue; // nothing to do
  }

  if (!write) continue;

  // Generate sections
  const sections = [];
  for (const [subpath, dtsRelative] of Object.entries(subpaths)) {
    const exports = await extractSubpathExports(distDir, dtsRelative);
    sections.push({ subpath, exports });
  }

  const skeleton = renderApiMd(name, description, sections);
  const withHash = embedHash(skeleton, currentHash);
  await writeFile(apiMdPath, withHash, 'utf8');
  writtenCount++;
  log(`  WRITTEN  ${rel}/API.md`);
}

const summary = write
  ? `generate:api — written: ${writtenCount}, already up-to-date: ${upToDateCount}`
  : `generate:api — missing: ${missingCount}, stale: ${staleCount}, up-to-date: ${upToDateCount}`;

log(`\n${summary}`);

// In check mode, exit 1 if any issues found
if (!write && (missingCount > 0 || staleCount > 0)) {
  process.exitCode = 1;
}
