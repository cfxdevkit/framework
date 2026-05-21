#!/usr/bin/env node
/**
 * Validates that pnpm-workspace.template.yaml matches the actual packages
 * directory structure. Run before releases or when adding/removing packages.
 *
 * Usage: node scripts/validate-workspace.mjs
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const repoRoot = resolve(__dirname, '..');

const templatePath = join(repoRoot, 'pnpm-workspace.template.yaml');
if (!existsSync(templatePath)) {
  console.error(`ERROR: Template file not found: ${templatePath}`);
  process.exit(1);
}

const templateContent = readFileSync(templatePath, 'utf-8');

// Parse glob patterns from the YAML (handles `- "packages/*"` lines)
const patterns = [];
for (const line of templateContent.split('\n')) {
  const match = line.match(/^\s+-\s+"([^"]+)"/);
  if (match) patterns.push(match[1]);
}

if (patterns.length === 0) {
  console.error('ERROR: No patterns found in template file');
  process.exit(1);
}

console.log(`Template patterns (${patterns.length}):`);
for (const p of patterns) console.log(`  ${p}`);
console.log();

let errors = 0;

for (const pattern of patterns) {
  // Only handles trailing `/*` glob for now
  if (!pattern.endsWith('/*')) {
    console.warn(`WARN: Skipping non-wildcard pattern: ${pattern}`);
    continue;
  }

  const baseDir = join(repoRoot, pattern.slice(0, -2));

  if (!existsSync(baseDir)) {
    console.error(`ERROR: Pattern base directory does not exist: ${baseDir}`);
    errors++;
    continue;
  }

  const entries = readdirSync(baseDir).filter((e) => {
    const p = join(baseDir, e);
    return statSync(p).isDirectory();
  });

  if (entries.length === 0) {
    console.warn(`WARN: No subdirectories found under ${pattern.slice(0, -2)}/`);
    continue;
  }

  for (const entry of entries) {
    const pkgJsonPath = join(baseDir, entry, 'package.json');
    if (!existsSync(pkgJsonPath)) {
      console.warn(
        `  WARN  ${pattern.slice(0, -2)}/${entry}  (no package.json — non-package directory)`,
      );
    } else {
      const pkg = JSON.parse(readFileSync(pkgJsonPath, 'utf-8'));
      console.log(`  OK  ${pattern.slice(0, -2)}/${entry}  (${pkg.name ?? 'unnamed'})`);
    }
  }
}

console.log();
if (errors > 0) {
  console.error(`Workspace template validation FAILED (${errors} error(s))`);
  process.exit(1);
} else {
  console.log('Workspace template validation PASSED');
}
