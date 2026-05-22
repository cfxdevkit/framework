import { readFile, stat } from 'node:fs/promises';
import { dirname, extname, join } from 'node:path';
import type { PublicPackageInfo } from '../api/filter.js';
import { discoverPublicPackages } from '../api/filter.js';
import { computeApiHash, readEmbeddedHash } from '../api/hash.js';
import type { AgentSummary, Finding } from '../runtime.js';
import {
  collectCorpusFiles,
  docExtensions,
  findFiles,
  printSummary,
  renderFindings,
  root,
  toRel,
  writeJsonReport,
  writeMarkdownReport,
} from '../runtime.js';
import {
  checkPackageDocumentContracts,
  checkRootToolingScripts,
  checkWorkspaceDocumentContracts,
} from './docs-contracts.js';
import { findBrokenPathRefs, findCurrentPlannedDrift } from './docs-paths.js';

export async function runDocsCheck(opts: { silent?: boolean } = {}): Promise<AgentSummary> {
  const publicPackages = await discoverPublicPackages();
  const markdownFiles = (await collectCorpusFiles()).filter((file) =>
    docExtensions.has(extname(file)),
  );
  const findings: Finding[] = [];
  for (const filePath of markdownFiles) {
    const rel = toRel(filePath);
    const content = await readFile(filePath, 'utf8');
    findings.push(...(await findBrokenPathRefs(rel, content)));
    findings.push(...findCurrentPlannedDrift(rel, content));
  }

  findings.push(...(await checkWorkspaceDocumentContracts(publicPackages)));
  findings.push(...(await checkRootToolingScripts()));
  findings.push(...(await checkMoonRegistration()));
  findings.push(...(await checkPackageExports()));
  findings.push(...(await checkApiDocs(publicPackages)));
  findings.push(...(await checkPackageDocumentContracts(publicPackages)));

  const report = {
    generatedAt: new Date().toISOString(),
    status: findings.some((finding) => finding.severity === 'error') ? 'error' : 'ok',
    findings,
  };
  await writeJsonReport('reports/docs-alignment.json', report);
  await writeMarkdownReport(
    'reports/docs-alignment.md',
    renderFindings('Documentation Alignment', findings),
  );
  if (!opts.silent) printSummary('check:docs', [report]);
  return { agent: 'docs', status: report.status, findings: findings.length };
}

async function checkMoonRegistration(): Promise<Finding[]> {
  const findings: Finding[] = [];
  const workspace = await readFile(join(root, '.moon', 'workspace.yml'), 'utf8');
  const registered = new Set(
    workspace
      .split('\n')
      .map((line) => line.match(/^\s*-\s+'([^']+)'/)?.[1])
      .filter((path): path is string => Boolean(path)),
  );
  for (const packageJson of await findFiles(root, 'package.json')) {
    const rel = dirname(toRel(packageJson));
    if (rel === '.' || (rel.startsWith('repos/cfx-') && rel.split('/').length === 2)) continue;
    if (rel.startsWith('.ideas/')) continue;
    if (rel.startsWith('tools/codegen')) continue;
    const pkg = JSON.parse(await readFile(packageJson, 'utf8')) as {
      name?: string;
      private?: boolean;
    };
    if (!pkg.name || (pkg.private === true && rel.startsWith('repos/'))) continue;
    try {
      await stat(join(root, rel, 'moon.yml'));
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

async function checkPackageExports(): Promise<Finding[]> {
  const findings: Finding[] = [];
  for (const packageJson of await findFiles(root, 'package.json')) {
    const rel = dirname(toRel(packageJson));
    if (!rel.startsWith('repos/') && !rel.startsWith('projects/examples/packages/')) continue;
    const pkg = JSON.parse(await readFile(packageJson, 'utf8')) as {
      exports?: Record<string, unknown>;
    };
    if (!pkg.exports || typeof pkg.exports !== 'object') continue;
    let vite = '';
    try {
      vite = await readFile(join(root, rel, 'vite.config.ts'), 'utf8');
    } catch {
      findings.push({
        severity: 'warning',
        file: rel,
        issue: 'Package has exports but no vite.config.ts found.',
      });
      continue;
    }
    for (const [exportPath, target] of Object.entries(pkg.exports)) {
      const importPath =
        typeof target === 'object' && target ? (target as { import?: unknown }).import : undefined;
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

async function checkApiDocs(packages: readonly PublicPackageInfo[]): Promise<Finding[]> {
  const findings: Finding[] = [];
  for (const pkg of packages) {
    const { rel, subpaths, distDir, apiMdPath } = pkg;
    // Check if API.md exists
    let apiMdContent: string | null = null;
    try {
      apiMdContent = await readFile(apiMdPath, 'utf8');
    } catch {
      findings.push({
        severity: 'warning',
        file: rel,
        issue: `Public package missing API.md: ${rel}`,
        recommendation: 'Run `pnpm gen:api` to generate API.md',
      });
      continue;
    }

    // Check for hash footer
    const embeddedHash = readEmbeddedHash(apiMdContent);
    if (!embeddedHash) {
      findings.push({
        severity: 'warning',
        file: `${rel}/API.md`,
        issue: `API.md has no api-hash footer (run generate:api --write): ${rel}`,
        recommendation: 'Run `pnpm gen:api` to regenerate with hash footer',
      });
      continue;
    }

    // Recompute hash and compare
    const dtsContents: string[] = [];
    for (const [, dtsRelative] of Object.entries(subpaths)) {
      const { join: pathJoin } = await import('node:path');
      const fullPath = pathJoin(distDir, dtsRelative);
      try {
        dtsContents.push(await readFile(fullPath, 'utf8'));
      } catch {
        dtsContents.push('');
      }
    }
    const currentHash = computeApiHash(dtsContents);
    if (currentHash !== embeddedHash) {
      findings.push({
        severity: 'warning',
        file: `${rel}/API.md`,
        issue: `API.md is stale (exports changed): ${rel}`,
        recommendation: 'Run `pnpm gen:api` to regenerate',
      });
    }
  }
  return findings;
}
