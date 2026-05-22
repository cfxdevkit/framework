import { readFile, readdir, stat } from 'node:fs/promises';
import { dirname, extname, join, resolve } from 'node:path';
import { type PublicPackageInfo, discoverPublicPackages } from '../api/filter.js';
import { computeApiHash, readEmbeddedHash } from '../api/hash.js';
import { detectLegacyStructureAlias, structureIdentityTokens } from '../api/structure.js';
import {
  findUnexpectedReferenceDocuments,
  getDocsRootDocumentRequirements,
  getProjectRootDocumentRequirements,
  getPublicPackageDocumentRequirements,
  getRepoRootDocumentRequirements,
  getWorkspaceRootDocumentRequirements,
  validateDocumentContent,
  validateScriptRequirements,
} from '../contracts/workspace.js';
import {
  type AgentSummary,
  collectCorpusFiles,
  docExtensions,
  type Finding,
  findFiles,
  inlineCodePattern,
  markdownLinkPattern,
  printSummary,
  renderFindings,
  root,
  toRel,
  writeJsonReport,
  writeMarkdownReport,
} from '../runtime.js';

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

async function checkPackageDocumentContracts(
  packages: readonly PublicPackageInfo[],
): Promise<Finding[]> {
  const findings: Finding[] = [];
  for (const pkg of packages) {
    const { rel } = pkg;
    const requirements = getPublicPackageDocumentRequirements(rel);
    for (const requirement of requirements) {
      const docRel = `${rel}/${requirement.path}`;
      const docPath = join(root, rel, requirement.path);
      let content: string;
      try {
        content = await readFile(docPath, 'utf8');
      } catch {
        findings.push({
          severity: requirement.severity,
          file: docRel,
          rule: 'document-contract',
          issue: `Public package missing ${requirement.path}: ${rel}`,
          recommendation: requirement.recommendation,
        });
        continue;
      }

      const missingChecks = validateDocumentContent(requirement, content);
      if (missingChecks.length > 0) {
        findings.push({
          severity: requirement.severity,
          file: docRel,
          rule: 'document-contract',
          issue: `${requirement.path} is missing required shape elements: ${missingChecks.join(', ')}`,
          recommendation: requirement.recommendation,
        });
      }

      if (requirement.path === 'STRUCTURE.md') {
        findings.push(...checkStructureIdentity(pkg, content));
      }
    }

    findings.push(
      ...(await checkUnexpectedRootLevelDocs(rel, requirements, ['API.md'])),
    );
  }
  return findings;
}

function checkStructureIdentity(pkg: PublicPackageInfo, content: string): Finding[] {
  const findings: Finding[] = [];
  const identityTokens = structureIdentityTokens(pkg);

  if (!identityTokens.some((token) => content.includes(token))) {
    findings.push({
      severity: 'warning',
      file: `${pkg.rel}/STRUCTURE.md`,
      rule: 'document-contract',
      issue: 'STRUCTURE.md does not identify the package by its actual package name or workspace path.',
      recommendation: 'Regenerate the file with `pnpm gen:structure` to normalize package identity.',
    });
  }

  const legacyAlias = detectLegacyStructureAlias(content);
  if (legacyAlias) {
    findings.push({
      severity: 'warning',
      file: `${pkg.rel}/STRUCTURE.md`,
      rule: 'document-contract',
      issue: `STRUCTURE.md still uses legacy tier alias ${legacyAlias} in its title, which conflicts with the canonical workspace path ${pkg.rel}.`,
      recommendation: 'Prefer the real workspace path and package name over legacy framework/platform/domains aliases.',
    });
  }

  return findings;
}

async function checkWorkspaceDocumentContracts(
  publicPackages: readonly PublicPackageInfo[],
): Promise<Finding[]> {
  const findings: Finding[] = [];
  const targets = [
    { baseDir: '.', requirements: getWorkspaceRootDocumentRequirements() },
    { baseDir: 'docs', requirements: getDocsRootDocumentRequirements() },
    ...(await collectDirectChildDirectories('repos')).map((baseDir) => ({
      baseDir,
      requirements: getRepoRootDocumentRequirements(),
    })),
    ...(await collectDirectChildDirectories('projects')).map((baseDir) => ({
      baseDir,
      requirements: getProjectRootDocumentRequirements(baseDir),
    })),
  ];

  const packageDirs = new Set(publicPackages.map((pkg) => pkg.rel));
  for (const target of targets) {
    if (packageDirs.has(target.baseDir)) continue;
    for (const requirement of target.requirements) {
      const docRel = target.baseDir === '.' ? requirement.path : `${target.baseDir}/${requirement.path}`;
      const docPath = join(root, docRel);
      let content: string;
      try {
        content = await readFile(docPath, 'utf8');
      } catch {
        findings.push({
          severity: requirement.severity,
          file: docRel,
          rule: 'document-contract',
          issue: `Missing ${requirement.path} for ${target.baseDir === '.' ? 'workspace root' : target.baseDir}.`,
          recommendation: requirement.recommendation,
        });
        continue;
      }

      const missingChecks = validateDocumentContent(requirement, content);
      if (missingChecks.length > 0) {
        findings.push({
          severity: requirement.severity,
          file: docRel,
          rule: 'document-contract',
          issue: `${docRel} is missing required shape elements: ${missingChecks.join(', ')}`,
          recommendation: requirement.recommendation,
        });
      }
    }

    if (
      target.baseDir === '.' ||
      target.baseDir === 'docs' ||
      target.baseDir.startsWith('repos/') ||
      target.baseDir.startsWith('projects/')
    ) {
      findings.push(...(await checkUnexpectedRootLevelDocs(target.baseDir, target.requirements)));
    }
  }

  return findings;
}

async function checkUnexpectedRootLevelDocs(
  baseDir: string,
  requirements: readonly { path: string }[],
  allowedNames: readonly string[] = [],
): Promise<Finding[]> {
  const entries = await readdir(join(root, baseDir), { withFileTypes: true });
  const fileNames = entries.filter((entry) => entry.isFile()).map((entry) => entry.name);
  const unexpected = findUnexpectedReferenceDocuments(fileNames, requirements, allowedNames);

  return unexpected.map((fileName) => ({
    severity: 'warning' as const,
    file: `${baseDir}/${fileName}`,
    rule: 'document-contract',
    issue: `Unexpected root-level reference document is outside the managed contract: ${fileName}`,
    recommendation: 'Remove the file or add it to the typed docs contract before checking it in.',
  }));
}

async function checkRootToolingScripts(): Promise<Finding[]> {
  const packageJson = JSON.parse(await readFile(join(root, 'package.json'), 'utf8')) as {
    scripts?: Record<string, string>;
  };
  return validateScriptRequirements(packageJson.scripts ?? {});
}

async function collectDirectChildDirectories(baseDir: string): Promise<string[]> {
  try {
    const entries = await readdir(join(root, baseDir), { withFileTypes: true });
    return entries
      .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
      .map((entry) => `${baseDir}/${entry.name}`)
      .sort((left, right) => left.localeCompare(right));
  } catch {
    return [];
  }
}

async function findBrokenPathRefs(path: string, content: string): Promise<Finding[]> {
  const findings: Finding[] = [];
  for (const { raw, source } of extractPathRefs(content)) {
    const ref = raw.split('#')[0] ?? '';
    if (!looksLikeLocalPath(ref, source)) continue;
    const candidates = resolveDocRefCandidates(path, ref);
    if (candidates.some((candidate) => !candidate.startsWith(root))) {
      findings.push({
        severity: 'error',
        file: path,
        issue: `Path reference escapes repository: ${raw}`,
      });
      continue;
    }
    let found = false;
    for (const candidate of candidates) {
      try {
        await stat(candidate);
        found = true;
        break;
      } catch {
        // try next candidate
      }
    }
    if (!found)
      findings.push({
        severity: 'warning',
        file: path,
        issue: `Referenced path does not exist: ${raw}`,
      });
  }
  return findings;
}

function extractPathRefs(content: string): { raw: string; source: 'link' | 'code' }[] {
  const refs: { raw: string; source: 'link' | 'code' }[] = [];
  const withoutFencedBlocks = content.replace(/```[\s\S]*?```/g, '');
  for (const match of withoutFencedBlocks.matchAll(markdownLinkPattern))
    refs.push({ raw: (match[1] ?? '').trim(), source: 'link' });
  for (const match of withoutFencedBlocks.matchAll(inlineCodePattern))
    refs.push({ raw: (match[1] ?? '').trim(), source: 'code' });
  return refs;
}

function findCurrentPlannedDrift(path: string, content: string): Finding[] {
  if (
    /planned|target state|future/i.test(content) &&
    !/current|checked-in|present/i.test(content) &&
    path.endsWith('STRUCTURE.md')
  ) {
    return [
      {
        severity: 'warning',
        file: path,
        issue: 'Planned structure language appears without an explicit current-state marker.',
        recommendation: 'Label planned topology separately from checked-in structure.',
      },
    ];
  }
  return [];
}

function looksLikeLocalPath(ref: string, source: 'link' | 'code'): boolean {
  if (!ref || ref.startsWith('http:') || ref.startsWith('https:') || ref.startsWith('mailto:'))
    return false;
  if (ref.startsWith('#') || ref.startsWith('/') || ref.startsWith('@') || ref.includes('@'))
    return false;
  if (ref.includes('*') || /[<>{}\s]/.test(ref)) return false;
  if (source === 'code') {
    if (
      /^(README\.md|ARCHITECTURE\.md|CHANGELOG\.md|CLAUDE\.md|CONTRIBUTING\.md|MIGRATION\.md|OPENSPEC\.md|SECURITY\.md|package\.json|pnpm-workspace\.yaml|biome\.json)$/.test(
        ref,
      )
    ) {
      return true;
    }

    if (/^(\.github\/|\.moon\/|docs\/|infrastructure\/|openspec\/|projects\/|repos\/|scripts\/)/.test(ref)) {
      return true;
    }

    if (/^\.\.?\//.test(ref)) {
      return /\/$|\.[a-z0-9]+$/i.test(ref);
    }

    return false;
  }
  return /[/.]/.test(ref);
}

function resolveDocRefCandidates(docPath: string, ref: string): string[] {
  const local = resolve(dirname(join(root, docPath)), ref);
  if (ref.startsWith('./') || ref.startsWith('../')) return [local];
  return [local, resolve(root, ref)];
}
