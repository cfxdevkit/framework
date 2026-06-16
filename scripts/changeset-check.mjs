#!/usr/bin/env node
/**
 * `scripts/changeset-check.mjs`
 *
 * Workspace-level changeset gate. Runs before `changeset version` to verify
 * that all pending publishable changes have a corresponding `.changeset/*.md` file.
 *
 * Usage:
 *   node scripts/changeset-check.mjs          # check all staged changes
 *   node scripts/changeset-check.mjs --scope  # check specific packages (comma-separated)
 *   node scripts/changeset-check.mjs --diff   # check uncommitted diff (not just staged)
 *
 * Exit codes:
 *   0 — All changes are covered by existing changesets or are non-publishable.
 *   1 — Publishable package changes detected but no changeset entry exists.
 */

import { existsSync, readdirSync } from 'node:fs';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { execSync } from 'node:child_process';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// ── Flags ────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const scopeArg = args.includes('--scope')
  ? args[args.indexOf('--scope') + 1]
      ?.split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  : [];
const useDiff = args.includes('--diff');

// ── Helpers ──────────────────────────────────────────────────────────────────

function safeExec(cmd) {
  try {
    return execSync(cmd, { cwd: root, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
  } catch {
    return '';
  }
}

async function loadChangesetConfig() {
  const configPath = join(root, '.changeset', 'config.json');
  if (!existsSync(configPath)) return { ignore: [] };
  return JSON.parse(await readFile(configPath, 'utf8'));
}

/** Collect all publishable (non-private, non-ignored) packages. */
async function collectPublishablePackages() {
  const config = await loadChangesetConfig();
  const ignored = new Set(config.ignore ?? []);
  const reposDir = join(root, 'repos');
  const packages = [];

  for (const repoName of readdirSync(reposDir).filter((r) => r.startsWith('cfx-'))) {
    const packagesDir = join(reposDir, repoName, 'packages');
    if (!existsSync(packagesDir)) continue;

    for (const packageDirName of readdirSync(packagesDir)) {
      const dir = `repos/${repoName}/packages/${packageDirName}`;
      const packageJsonPath = join(root, dir, 'package.json');
      if (!existsSync(packageJsonPath)) continue;

      const pkg = JSON.parse(await readFile(packageJsonPath, 'utf8'));
      if (!pkg.name || pkg.private || ignored.has(pkg.name)) continue;
      packages.push({ name: pkg.name, dir });
    }
  }

  return packages.sort((a, b) => a.name.localeCompare(b.name));
}

/** Get changed file paths (staged or uncommitted). */
function getChangedFiles() {
  if (useDiff) {
    // Uncommitted changes (staged + unstaged)
    const staged = safeExec('git diff --name-only --cached') || '';
    const unstaged = safeExec('git diff --name-only') || '';
    return [...new Set([...staged.trim().split('\n'), ...unstaged.trim().split('\n')])].filter(
      Boolean,
    );
  }
  // Staged changes only
  const output = safeExec('git diff --name-only --cached') || '';
  return output.trim().split('\n').filter(Boolean);
}

/** Get existing changeset files. */
function getChangesetFiles() {
  const csDir = join(root, '.changeset');
  if (!existsSync(csDir)) return [];
  return readdirSync(csDir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => `.changeset/${f}`);
}

/** Parse which packages a changeset file covers. */
function parseChangesetPackages(changesetFile) {
  const content = safeExec(`cat "${join(root, changesetFile)}"`);
  const packages = [];
  const lines = content.split('\n');
  let inYaml = false;

  for (const line of lines) {
    if (line.trim() === '---') {
      inYaml = !inYaml;
      continue;
    }
    if (inYaml) {
      const match = line.match(/^("?@?[^":]+"?)?:\s*(patch|minor|major)$/);
      if (match) {
        let name = match[1].replace(/"/g, '');
        packages.push(name);
      }
    }
  }
  return packages;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const packages = await collectPublishablePackages();
  const changedFiles = getChangedFiles();
  const changesetFiles = getChangesetFiles();
  const changedPackages = new Set();

  // Determine which publishable packages were modified
  for (const file of changedFiles) {
    for (const pkg of packages) {
      if (file === pkg.dir || file.startsWith(`${pkg.dir}/`)) {
        changedPackages.add(pkg.name);
      }
    }
  }

  if (changedPackages.size === 0) {
    console.log('✅ No publishable package changes detected.');
    process.exit(0);
  }

  // Filter by scope if specified
  const scope = scopeArg.length > 0;
  const filteredPackages = scope
    ? [...changedPackages].filter((p) => scopeArg.some((s) => p.includes(s)))
    : [...changedPackages];

  if (filteredPackages.length === 0) {
    console.log('✅ No publishable package changes in specified scope.');
    process.exit(0);
  }

  // Check which packages need changesets
  const coveredPackages = new Set();
  for (const csFile of changesetFiles) {
    const pkgNames = parseChangesetPackages(csFile);
    for (const name of pkgNames) {
      coveredPackages.add(name);
    }
  }

  const needsChangeset = filteredPackages.filter((p) => !coveredPackages.has(p));

  if (needsChangeset.length === 0) {
    console.log(`✅ All ${filteredPackages.length} changed package(s) covered by changeset(s).`);
    console.log(`   ${filteredPackages.join(', ')}`);
    process.exit(0);
  }

  // ── Failure: missing changesets ────────────────────────────────────────────
  console.error('❌ Missing Changeset entries for the following package(s):');
  for (const name of needsChangeset) {
    const pkg = packages.find((p) => p.name === name);
    console.error(`   • ${name}  (${pkg ? pkg.dir : 'unknown'})`);
  }
  console.error('');
  console.error('To create a Changeset entry, run:');
  console.error(`   npx changeset`);
  console.error('');
  console.error('Or generate one via the LLM agent:');
  console.error(`   pnpm run llm:changeset:generate`);
  console.error('');
  console.error('Then commit the .changeset/*.md file before running `changeset version`.');
  process.exit(1);
}

main().catch((err) => {
  console.error('Changeset check failed:', err.message);
  process.exit(1);
});
