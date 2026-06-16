#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dryRun = process.argv.includes('--dry-run');
const changesetConfigPath = resolve(rootDir, '.changeset/config.json');
const ignoredPackages = existsSync(changesetConfigPath)
  ? new Set(JSON.parse(readFileSync(changesetConfigPath, 'utf8')).ignore ?? [])
  : new Set();

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: rootDir,
    encoding: 'utf8',
    stdio: options.capture ? 'pipe' : 'inherit',
  });

  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed`);
  }

  return result.stdout?.trim() ?? '';
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function collectPackageDirs() {
  const reposDir = resolve(rootDir, 'repos');
  const packageDirs = [];

  for (const repoName of readdirSync(reposDir)) {
    if (!repoName.startsWith('cfx-')) continue;

    const packagesDir = resolve(reposDir, repoName, 'packages');
    if (!existsSync(packagesDir)) continue;

    for (const packageName of readdirSync(packagesDir)) {
      const packageDir = resolve(packagesDir, packageName);
      if (existsSync(resolve(packageDir, 'package.json'))) {
        packageDirs.push(packageDir);
      }
    }
  }

  // Explicitly exclude the root workspace package (the monorepo itself)
  return packageDirs.filter((d) => d !== rootDir).sort();
}

function packageExists(packageName, version) {
  const result = spawnSync('npm', ['view', `${packageName}@${version}`, 'version'], {
    cwd: rootDir,
    encoding: 'utf8',
    stdio: 'pipe',
  });

  return result.status === 0;
}

function packageIsRegistered(packageName) {
  const result = spawnSync('npm', ['view', packageName, 'name'], {
    cwd: rootDir,
    encoding: 'utf8',
    stdio: 'pipe',
  });

  return result.status === 0;
}

// OIDC is only available in CI (GitHub Actions). --provenance requires an
// OIDC identity token; it fails with a traditional npm token from `npm login`.
const hasOidc =
  process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN !== undefined ||
  process.env.ACTIONS_ID_TOKEN_REQUEST_URL !== undefined;

for (const packageDir of collectPackageDirs()) {
  const packageJson = readJson(resolve(packageDir, 'package.json'));
  const packageName = packageJson.name;
  const version = packageJson.version;

  if (!packageName || packageJson.private || ignoredPackages.has(packageName)) {
    console.log(`Skipping ${packageName ?? packageDir}`);
    continue;
  }

  if (!dryRun && packageExists(packageName, version)) {
    console.log(`Skipping ${packageName}@${version}; already published`);
    continue;
  }

  console.log(`Packing ${packageName}@${version}`);
  const packOutput = run('pnpm', ['pack', '-C', packageDir, '--pack-destination', rootDir], {
    capture: true,
  });
  const tarballName = packOutput.split(/\r?\n/).at(-1);
  const tarballPath = resolve(rootDir, tarballName);

  try {
    const publishArgs = ['publish', tarballPath, '--access', 'public'];
    if (process.env.NPM_TOKEN) {
      publishArgs.push('--auth-token', process.env.NPM_TOKEN);
    }
    if (dryRun) publishArgs.push('--dry-run');

    if (hasOidc && packageIsRegistered(packageName)) {
      // CI with OIDC — use provenance for existing packages.
      console.log(`  → with provenance (package already registered, OIDC available)`);
      publishArgs.push('--provenance');
    } else if (packageIsRegistered(packageName)) {
      // Local run with traditional token — provenance requires OIDC.
      // Existing packages are published without provenance; add it later
      // by running this script in CI (or via https://npmjs.com/settings/<user>/provenance).
      console.log(`  → no provenance (OIDC not available — use CI for provenance)`);
    } else if (!dryRun) {
      // New package — npm blocks provenance for first publishes.
      console.log(`  → no provenance (new package — set up via npm website)`);
      console.log(`    To add provenance later: visit https://npmjs.com/settings/<user>/provenance`);
    }

    run('npm', publishArgs);
  } finally {
    rmSync(tarballPath, { force: true });
  }
}
