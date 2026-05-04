// @ts-nocheck
import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { readContextFile } from './lemonade-completion.ts';
import { normalizeScopeFilter } from './lemonade-docs.ts';
import { execFileAsync, root } from './lemonade-shared.ts';

export function parseTestUpkeepFlags(args) {
  const promptParts = [];
  const scopes = [];
  let model = null;
  let quick = false;
  let write = false;
  let yes = false;
  let skipTestRun = false;
  let agent = 'direct';
  let piProvider = null;
  let piModel = null;
  let maxPackages = Number.POSITIVE_INFINITY;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--model') model = args[++i];
    else if (arg === '--agent') agent = args[++i];
    else if (arg === '--pi-provider') piProvider = args[++i];
    else if (arg === '--pi-model') piModel = args[++i];
    else if (arg === '--quick') quick = true;
    else if (arg === '--write') write = true;
    else if (arg === '--yes' || arg === '-y') yes = true;
    else if (arg === '--skip-test-run') skipTestRun = true;
    else if (arg === '--scope') scopes.push(args[++i]);
    else if (arg === '--max-packages') maxPackages = Number(args[++i]);
    else promptParts.push(arg);
  }
  if (!['direct', 'pi-rpc'].includes(agent)) {
    throw new Error('Test upkeep --agent must be one of: direct, pi-rpc');
  }
  return {
    prompt: promptParts.join(' ').trim(),
    model,
    agent,
    piProvider,
    piModel,
    quick,
    write,
    yes,
    skipTestRun,
    scopes: scopes.filter(Boolean),
    maxPackages:
      Number.isFinite(maxPackages) && maxPackages > 0 ? maxPackages : Number.POSITIVE_INFINITY,
  };
}

export async function discoverTestUpkeepPackages(flags) {
  const vitestConfigs = [];
  await walkForFiles(
    root,
    (name) => name === 'vitest.config.ts' || name === 'vitest.config.js',
    vitestConfigs,
    ['node_modules', 'dist', 'coverage', 'artifacts', '.git', '.moon'],
  );
  const scopeFilters = flags.scopes.map(normalizeScopeFilter);
  const packages = [];
  for (const cfgPath of vitestConfigs) {
    const pkgDir = dirname(cfgPath).replace(`${root}/`, '');
    if (scopeFilters.length && !scopeFilters.some((s) => pkgDir.startsWith(s))) continue;
    let pkgJson = {};
    try {
      pkgJson = JSON.parse(await readFile(join(root, pkgDir, 'package.json'), 'utf8'));
    } catch {
      /* optional */
    }
    packages.push({
      key: pkgDir,
      label: pkgDir,
      dir: pkgDir,
      pkgName: pkgJson.name ?? pkgDir,
      pkgJson,
    });
  }
  return packages.sort((a, b) => a.label.localeCompare(b.label)).slice(0, flags.maxPackages);
}

export async function walkForFiles(dir, predicate, found, ignore = []) {
  let entries = [];
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (ignore.includes(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) await walkForFiles(path, predicate, found, ignore);
    if (entry.isFile() && predicate(entry.name)) found.push(path);
  }
}

export async function collectPackageTestInventory(pkg) {
  const srcDir = join(root, pkg.dir, 'src');
  const allTs = [];
  await walkForFiles(srcDir, (name) => name.endsWith('.ts') || name.endsWith('.tsx'), allTs, [
    'node_modules',
    'dist',
    'coverage',
  ]);
  const relativeToSrc = (abs) => abs.replace(`${srcDir}/`, 'src/');
  const testFiles = new Set(
    allTs.filter((f) => f.endsWith('.test.ts') || f.endsWith('.spec.ts')).map(relativeToSrc),
  );
  const sourceFiles = allTs
    .filter((f) => !f.endsWith('.test.ts') && !f.endsWith('.spec.ts') && !f.endsWith('.d.ts'))
    .map(relativeToSrc);
  const untestedFiles = sourceFiles.filter((f) => {
    const base = f.replace(/\.tsx?$/, '');
    return !testFiles.has(`${base}.test.ts`) && !testFiles.has(`${base}.spec.ts`);
  });
  return {
    sourceFiles,
    testFiles: [...testFiles],
    untestedFiles,
    sourceCount: sourceFiles.length,
    testCount: testFiles.size,
    untestedCount: untestedFiles.length,
  };
}

export async function runPackageTestsBlock(pkg) {
  try {
    const { stdout, stderr } = await execFileAsync(
      'pnpm',
      ['exec', 'vitest', 'run', '--passWithNoTests', '--reporter=verbose'],
      {
        cwd: join(root, pkg.dir),
        maxBuffer: 1024 * 1024 * 4,
        signal: AbortSignal.timeout(120000),
        env: { ...process.env, NO_COLOR: '1', FORCE_COLOR: '0' },
      },
    );
    return {
      ok: true,
      output: [stdout, stderr].filter(Boolean).join('\n').trim().slice(0, 8000),
    };
  } catch (error) {
    return {
      ok: false,
      output: [error?.stdout ?? '', error?.stderr ?? error?.message ?? '']
        .filter(Boolean)
        .join('\n')
        .trim()
        .slice(0, 8000),
    };
  }
}

export function summarizePackageTestFailure(pkg) {
  const output = pkg.testOutput || '(no test output captured)';
  const firstUsefulLine = output
    .split('\n')
    .map((line) => line.trim())
    .find((line) => /fail|error|failed/i.test(line));
  return `Tests failed for ${pkg.label}${firstUsefulLine ? `: ${firstUsefulLine}` : ''}`;
}

export async function buildTestUpkeepBaseContext(flags) {
  const parts = await Promise.all([
    readContextFile('README.md'),
    readContextFile('ARCHITECTURE.md'),
    readContextFile('CONTRIBUTING.md'),
    readContextFile('.moon/tasks/node.yml'),
  ]);
  return parts
    .filter(Boolean)
    .join('\n\n')
    .slice(0, flags.quick ? 6000 : 14000);
}
