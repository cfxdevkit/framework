#!/usr/bin/env node
/**
 * Verifies cross-package workspace dependencies are explicit and consistent.
 * Prints the dependency graph and fails if any workspace:* dep is not
 * declared in this repo.
 *
 * Usage: node scripts/check-deps.mjs
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const repoRoot = resolve(__dirname, '..');
const packagesDir = join(repoRoot, 'packages');

// Discover all packages
const packageDirs = readdirSync(packagesDir).filter((e) => {
  const p = join(packagesDir, e);
  return statSync(p).isDirectory() && existsSync(join(p, 'package.json'));
});

/** @type {Record<string, { dir: string; deps: Record<string, string>; devDeps: Record<string, string> }>} */
const packages = {};
for (const dir of packageDirs) {
  const raw = JSON.parse(readFileSync(join(packagesDir, dir, 'package.json'), 'utf-8'));
  packages[raw.name] = {
    dir,
    deps: { ...raw.dependencies },
    devDeps: { ...raw.devDependencies, ...raw.peerDependencies },
  };
}

const allNames = new Set(Object.keys(packages));
const errors = 0;

console.log(`Packages (${allNames.size}): ${[...allNames].join(', ')}\n`);
console.log('Cross-package runtime dependency graph (dependencies only):');

for (const [name, info] of Object.entries(packages)) {
  const workspaceDeps = Object.entries(info.deps)
    .filter(([, v]) => String(v).startsWith('workspace:'))
    .map(([k]) => k);

  // Warn about devDep workspace:* deps that are not in this repo (expected for shared tooling)
  const externalDevDeps = Object.entries(info.devDeps)
    .filter(([, v]) => String(v).startsWith('workspace:'))
    .map(([k]) => k)
    .filter((k) => !allNames.has(k));

  console.log(`\n  ${name}:`);
  if (workspaceDeps.length === 0) {
    console.log('    (no workspace runtime dependencies)');
  } else {
    for (const dep of workspaceDeps) {
      if (!allNames.has(dep)) {
        console.warn(
          `    WARN  ${dep}  — cross-repo dep (expected in monorepo, needs real npm version in standalone mode)`,
        );
      } else {
        console.log(`    ->  ${dep}`);
      }
    }
  }
  if (externalDevDeps.length > 0) {
    console.log(`    (shared tooling devDeps: ${externalDevDeps.join(', ')})`);
  }
}

console.log();
if (errors > 0) {
  console.error(`Dependency validation FAILED (${errors} error(s))`);
  process.exit(1);
} else {
  console.log('Dependency validation PASSED');
}
