#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dryRun = process.argv.includes('--dry-run');
const changesetConfigPath = resolve(rootDir, '.changeset/config.json');
const ignoredPackages = existsSync(changesetConfigPath)
  ? new Set(JSON.parse(readFileSync(changesetConfigPath, 'utf8')).ignore ?? [])
  : new Set();

let failed = 0;

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: rootDir,
    encoding: 'utf8',
    stdio: options.capture ? 'pipe' : 'inherit',
  });

  if (result.status !== 0) {
    const output = result.stderr || result.stdout || '';
    console.error(`  ERROR: ${command} ${args.join(' ')}`);
    if (output) console.error(output.slice(-2000));
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

function versionExists(packageName, version) {
  const result = spawnSync('npm', ['view', `${packageName}@${version}`, 'name', '--json'], {
    cwd: rootDir,
    encoding: 'utf8',
    stdio: 'pipe',
  });
  if (result.status !== 0) return false;
  try {
    // npm view --json returns a JSON string (e.g. '"@scope/pkg"'), not an object
    const data = JSON.parse(result.stdout);
    return data === packageName;
  } catch {
    return false;
  }
}

function packageIsRegistered(packageName) {
  const result = spawnSync('npm', ['view', packageName, 'name', '--json'], {
    cwd: rootDir,
    encoding: 'utf8',
    stdio: 'pipe',
  });
  if (result.status !== 0) return false;
  try {
    const data = JSON.parse(result.stdout);
    return data === packageName;
  } catch {
    return false;
  }
}

function buildAuthArgs() {
  /**
   * Build npm auth arguments. Priority:
   *  1. NPM_TOKEN env var (CI or explicit local PAT)
   *  2. No auth args — rely on .npmrc (user logged in via `npm login`)
   *
   * The --auth-token flag is deprecated in npm 10+. When NPM_TOKEN is set,
   * we write a temporary .npmrc to guarantee authentication works for
   * first-time package creation (which --auth-token often fails for).
   */
  const token = process.env.NPM_TOKEN;
  if (token) {
    // Write a temporary .npmrc with the PAT — this is the only reliable
    // way to authenticate first-time package creation across npm versions.
    const tmpNpmrc = resolve(rootDir, '.npmrc.publish');
    writeFileSync(tmpNpmrc, `//registry.npmjs.org/:_authToken=${token}\n`, 'utf8');
    return ['--userconfig', tmpNpmrc];
  }
  return [];
}

function cleanupAuthFiles() {
  const tmpNpmrc = resolve(rootDir, '.npmrc.publish');
  if (existsSync(tmpNpmrc)) {
    rmSync(tmpNpmrc, { force: true });
  }
}

process.on('exit', cleanupAuthFiles);
process.on('SIGINT', () => { cleanupAuthFiles(); process.exit(1); });
process.on('SIGTERM', () => { cleanupAuthFiles(); process.exit(1); });

// OIDC is only available in CI (GitHub Actions).
const hasOidc =
  process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN !== undefined ||
  process.env.ACTIONS_ID_TOKEN_REQUEST_URL !== undefined;

const authArgs = buildAuthArgs();

if (authArgs.length > 0) {
  console.log('Using PAT authentication from NPM_TOKEN');
} else if (hasOidc) {
  console.log('Using OIDC authentication (CI)');
} else {
  console.log('Using .npmrc authentication (local `npm login`)');
}

console.log(`\nPackages to check: ${collectPackageDirs().filter((d) => {
  const pj = readJson(resolve(d, 'package.json'));
  return pj.name && !pj.private && !ignoredPackages.has(pj.name);
}).length}\n`);

for (const packageDir of collectPackageDirs()) {
  const packageJson = readJson(resolve(packageDir, 'package.json'));
  const packageName = packageJson.name;
  const version = packageJson.version;

  if (!packageName || packageJson.private || ignoredPackages.has(packageName)) {
    continue;
  }

  if (dryRun) {
    console.log(`[DRY RUN] Would publish ${packageName}@${version}`);
    continue;
  }

  // Check if this exact version already exists on npm
  if (versionExists(packageName, version)) {
    console.log(`⏭️  Skipping ${packageName}@${version}; already published`);
    continue;
  }

  const isRegistered = packageIsRegistered(packageName);
  const isNewPackage = !isRegistered;

  console.log(`📦 Packing ${packageName}@${version}`);
  const packOutput = run('pnpm', ['pack', '-C', packageDir, '--pack-destination', rootDir], {
    capture: true,
  });
  const tarballName = packOutput.split(/\r?\n/).at(-1);
  const tarballPath = resolve(rootDir, tarballName);

  try {
    const publishArgs = ['publish', tarballPath, '--access', 'public'];

    // Add auth args (from PAT or .npmrc)
    publishArgs.push(...authArgs);

    if (isNewPackage) {
      // npm blocks --provenance for first-time package creation.
      // New packages are always published WITHOUT provenance.
      console.log(`  → first-time publish (no provenance available)`);
      if (!hasOidc && authArgs.length === 0) {
        console.log(`  ⚠️  No auth configured. Make sure you ran \`npm login\`.`);
      }
    } else {
      // Existing package — use provenance if OIDC is available
      if (hasOidc) {
        console.log(`  → with provenance (OIDC + existing package)`);
        publishArgs.push('--provenance');
      } else {
        console.log(`  → no provenance (existing package, local run)`);
        console.log(`     (provenance will be added when run in CI)`);
      }
    }

    run('npm', publishArgs);
    console.log(`  ✅ Published ${packageName}@${version}`);
  } catch (err) {
    console.error(`  ❌ Failed to publish ${packageName}@${version}: ${err.message}`);
    failed++;
  } finally {
    rmSync(tarballPath, { force: true });
  }
}

cleanupAuthFiles();

if (failed > 0) {
  console.error(`\n❌ ${failed} package(s) failed to publish.`);
  process.exit(1);
} else {
  console.log(`\n✅ All packages published successfully.`);
}
