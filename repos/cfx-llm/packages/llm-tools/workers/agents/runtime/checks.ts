// @ts-nocheck
import { readdir, readFile, stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { execFileAsync, generatedDirs, root } from './constants.ts';
import { isSecuritySensitive, toRel } from './paths.ts';

export async function checkMoonRegistration() {
  const findings = [];
  const workspace = await readFile(join(root, '.moon', 'workspace.yml'), 'utf8');
  const registered = new Set(
    workspace
      .split('\n')
      .map((line) => line.match(/^\s*-\s+'([^']+)'/)?.[1])
      .filter(Boolean),
  );
  for (const packageJson of await findFiles(root, 'package.json')) {
    const rel = dirname(toRel(packageJson));
    if (rel === '.' || (rel.startsWith('repos/cfx-') && rel.split('/').length === 2)) continue;
    if (rel.startsWith('tools/codegen')) continue;
    const pkg = JSON.parse(await readFile(packageJson, 'utf8'));
    if (!pkg.name || (pkg.private === true && rel.startsWith('repos/'))) continue;
    const moonPath = join(root, rel, 'moon.yml');
    try {
      await stat(moonPath);
    } catch {
      continue;
    }
    if (!registered.has(rel)) {
      findings.push({
        severity: 'warning',
        file: '.moon/workspace.yml',
        issue: `Moon project missing package path: ${rel}`,
      });
    }
  }
  return findings;
}

export async function checkPackageExports() {
  const findings = [];
  for (const packageJson of await findFiles(root, 'package.json')) {
    const rel = dirname(toRel(packageJson));
    if (!rel.startsWith('repos/') && !rel.startsWith('projects/examples/packages/')) continue;
    const pkg = JSON.parse(await readFile(packageJson, 'utf8'));
    if (!pkg.exports || typeof pkg.exports !== 'object') continue;
    const vitePath = join(root, rel, 'vite.config.ts');
    let vite = '';
    try {
      vite = await readFile(vitePath, 'utf8');
    } catch {
      findings.push({
        severity: 'warning',
        file: rel,
        issue: 'Package has exports but no vite.config.ts found.',
      });
      continue;
    }
    for (const [exportPath, target] of Object.entries(pkg.exports)) {
      const importPath = typeof target === 'object' && target ? target.import : undefined;
      if (typeof importPath !== 'string') continue;
      const entryName = exportPath === '.' ? 'index' : exportPath.replace(/^\.\//, '');
      if (
        !vite.includes(entryName) &&
        !vite.includes(importPath.replace(/^\.\/dist\//, '').replace(/\.js$/, ''))
      ) {
        findings.push({
          severity: 'warning',
          file: `${rel}/package.json`,
          issue: `Export ${exportPath} may not be represented in vite lib entries.`,
        });
      }
    }
  }
  return findings;
}

export async function findFiles(dir, name) {
  const found = [];
  async function visit(current) {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      if (entry.isDirectory() && generatedDirs.has(entry.name)) continue;
      const path = join(current, entry.name);
      if (entry.isDirectory()) await visit(path);
      if (entry.isFile() && entry.name === name) found.push(path);
    }
  }
  await visit(dir);
  return found;
}

export async function gitChangedFiles() {
  const changed = new Set();
  for (const args of [
    ['diff', '--name-only'],
    ['diff', '--cached', '--name-only'],
    ['ls-files', '--others', '--exclude-standard'],
  ]) {
    const { stdout } = await execFileAsync('git', args, { cwd: root });
    for (const file of stdout.split('\n').filter(Boolean)) {
      changed.add(file);
    }
  }
  return [...changed].sort();
}

export function suggestValidationCommands(changed) {
  const commands = new Set();
  if (!changed.length) return ['pnpm run llm:docs', 'pnpm run llm:eval'];
  if (changed.some((file) => /\.(ts|tsx|js|mjs)$/.test(file))) {
    commands.add('pnpm run lint');
    commands.add('pnpm run typecheck');
    commands.add('pnpm exec moon run :test --concurrency 4');
  }
  if (
    changed.some((file) => file.endsWith('.md') || file.endsWith('.yml') || file.endsWith('.yaml'))
  ) {
    commands.add('pnpm run llm:docs');
  }
  if (changed.some(isSecuritySensitive)) {
    commands.add('pnpm run security:check');
  }
  commands.add('pnpm run llm:review');
  return [...commands];
}
