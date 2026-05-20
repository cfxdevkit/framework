import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { getLifecycle, getRulesFor, getTierFor } from '@cfxdevkit/arch-rules';
import { type Finding, generatedDirs, root, toRel } from '../runtime.js';

type PackageInfo = {
  name: string;
  path: string;
  tierId: string;
  level: number;
  packageJson: PackageJson;
};

type PackageJson = {
  name?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  private?: boolean;
};

const sourceFileExtensions = new Set(['.ts', '.tsx', '.js', '.mjs', '.cjs']);
const importSpecifierPattern =
  /\b(?:import|export)\s+(?:[^'";]+?\s+from\s+)?['"]([^'"]+)['"]|\bimport\(\s*['"]([^'"]+)['"]\s*\)/g;
const sourceRuleExemptions = ['repos/cfx-tools/packages/vscode-extension/src/'];

export type ArchCheckResult = {
  status: 'ok' | 'error';
  lifecycle: string;
  packageCount: number;
  findings: Finding[];
};

export async function runArchCheck(): Promise<ArchCheckResult> {
  const packages = await collectPackages();
  const packageByName = new Map(packages.map((pkg) => [pkg.name, pkg]));
  const findings: Finding[] = [];

  for (const pkg of packages) {
    const rules = getRulesFor(pkg.tierId).filter(
      (rule) => rule.enforce === 'always' || getLifecycle() === 'release',
    );
    const ruleIds = new Set(rules.map((rule) => rule.id));
    if (ruleIds.has('requires-moon-yml'))
      checkRequiredFile(pkg, 'moon.yml', 'requires-moon-yml', findings);
    if (ruleIds.has('requires-src-index'))
      checkRequiredFile(pkg, 'src/index.ts', 'requires-src-index', findings);
    if (ruleIds.has('no-upward-imports')) checkDependencies(pkg, packageByName, findings);
    if (ruleIds.has('no-internal-reach')) await checkInternalReach(pkg, packageByName, findings);
    if (
      ruleIds.has('file-size-hard-limit') ||
      ruleIds.has('no-ts-nocheck') ||
      ruleIds.has('no-js-mjs-source-files')
    ) {
      await checkSourceFiles(pkg, ruleIds, findings);
    }
  }

  const status = findings.some((finding) => finding.severity === 'error') ? 'error' : 'ok';
  return { status, lifecycle: getLifecycle(), packageCount: packages.length, findings };
}

async function collectPackages(): Promise<PackageInfo[]> {
  const packageJsonFiles = await findPackageJsonFiles(join(root, 'repos'));
  packageJsonFiles.push(...(await findPackageJsonFiles(join(root, 'projects'))));
  const packages: PackageInfo[] = [];
  for (const file of packageJsonFiles) {
    const packagePath = toRel(file).replace(/\/package\.json$/, '');
    const tier = getTierFor(packagePath);
    if (!tier) continue;
    const packageJson = JSON.parse(await readFile(file, 'utf8')) as PackageJson;
    if (!packageJson.name) continue;
    packages.push({
      name: packageJson.name,
      path: packagePath,
      tierId: tier.id,
      level: tier.level,
      packageJson,
    });
  }
  return packages.sort((left, right) => left.path.localeCompare(right.path));
}

async function findPackageJsonFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  if (!existsSync(dir)) return files;
  async function visit(current: string): Promise<void> {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      if (entry.isDirectory() && generatedDirs.has(entry.name)) continue;
      const path = join(current, entry.name);
      if (entry.isDirectory()) await visit(path);
      if (entry.isFile() && entry.name === 'package.json') files.push(path);
    }
  }
  await visit(dir);
  return files;
}

function checkRequiredFile(
  pkg: PackageInfo,
  relFile: string,
  rule: string,
  findings: Finding[],
): void {
  if (existsSync(join(root, pkg.path, relFile))) return;
  findings.push({
    severity: 'error',
    file: pkg.path,
    rule,
    issue: `${pkg.name} is missing ${relFile}`,
  });
}

function checkDependencies(
  pkg: PackageInfo,
  packageByName: Map<string, PackageInfo>,
  findings: Finding[],
): void {
  for (const field of ['dependencies', 'peerDependencies', 'optionalDependencies'] as const) {
    for (const depName of Object.keys(pkg.packageJson[field] ?? {})) {
      const dep = packageByName.get(depName);
      if (!dep) continue;
      if (dep.tierId === 'cross-cutting') {
        findings.push({
          severity: 'error',
          file: `${pkg.path}/package.json`,
          rule: 'no-upward-imports',
          issue: `${pkg.name} uses cross-cutting package ${depName} as a runtime dependency`,
        });
      } else if (dep.level > pkg.level) {
        findings.push({
          severity: 'error',
          file: `${pkg.path}/package.json`,
          rule: 'no-upward-imports',
          issue: `${pkg.name} depends on higher-tier package ${depName}`,
        });
      }
    }
  }
}

async function checkInternalReach(
  pkg: PackageInfo,
  packageByName: Map<string, PackageInfo>,
  findings: Finding[],
): Promise<void> {
  for (const file of await collectPackageSourceFiles(pkg)) {
    const rel = toRel(file);
    const content = await readFile(file, 'utf8');
    for (const dep of packageByName.values()) {
      if (dep.name === pkg.name) continue;
      if (importsInternalSource(content, dep)) {
        findings.push({
          severity: 'error',
          file: rel,
          rule: 'no-internal-reach',
          issue: `${pkg.name} reaches into ${dep.name} source internals`,
        });
      }
    }
  }
}

function importsInternalSource(content: string, dep: PackageInfo): boolean {
  for (const match of content.matchAll(importSpecifierPattern)) {
    const specifier = match[1] ?? match[2] ?? '';
    if (specifier.includes(`${dep.name}/src/`) || specifier.includes(`${dep.path}/src/`)) {
      return true;
    }
  }
  return false;
}

async function checkSourceFiles(
  pkg: PackageInfo,
  ruleIds: Set<string>,
  findings: Finding[],
): Promise<void> {
  for (const file of await collectPackageSourceFiles(pkg)) {
    const rel = toRel(file);
    const extension = extname(file);
    if (ruleIds.has('no-js-mjs-source-files') && ['.js', '.mjs', '.cjs'].includes(extension)) {
      findings.push({
        severity: 'error',
        file: rel,
        rule: 'no-js-mjs-source-files',
        issue: 'Source file must be TypeScript, not JavaScript.',
      });
    }
    const content = await readFile(file, 'utf8');
    if (
      ruleIds.has('no-ts-nocheck') &&
      !isSourceRuleExempt(rel) &&
      /^\s*\/\/\s*@ts-nocheck\b/m.test(content)
    ) {
      findings.push({
        severity: 'error',
        file: rel,
        rule: 'no-ts-nocheck',
        issue: 'Source file uses @ts-nocheck.',
      });
    }
    if (ruleIds.has('file-size-hard-limit')) {
      const lines = content ? content.split('\n').length - (content.endsWith('\n') ? 1 : 0) : 0;
      if (lines > 300)
        findings.push({
          severity: 'error',
          file: rel,
          rule: 'file-size-hard-limit',
          issue: `Source file has ${lines} lines (limit 300).`,
        });
    }
  }
}

function isSourceRuleExempt(path: string): boolean {
  return sourceRuleExemptions.some((prefix) => path.startsWith(prefix));
}

async function collectPackageSourceFiles(pkg: PackageInfo): Promise<string[]> {
  const src = join(root, pkg.path, 'src');
  const files: string[] = [];
  if (!existsSync(src)) return files;
  async function visit(current: string): Promise<void> {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      if (entry.isDirectory() && generatedDirs.has(entry.name)) continue;
      const path = join(current, entry.name);
      if (entry.isDirectory()) await visit(path);
      if (
        entry.isFile() &&
        sourceFileExtensions.has(extname(entry.name)) &&
        !isGeneratedSource(path)
      ) {
        files.push(path);
      }
    }
  }
  await visit(src);
  return files;
}

function isGeneratedSource(path: string): boolean {
  const rel = toRel(path);
  const basename = rel.split('/').at(-1) ?? '';
  return (
    rel.includes('/generated/') || rel.includes('/generated.') || basename.includes('.generated.')
  );
}
