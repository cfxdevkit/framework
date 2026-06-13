import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { PublicPackageInfo } from '../../api/filter.js';
import { detectLegacyStructureAlias, structureIdentityTokens } from '../../api/structure.js';
import {
  findUnexpectedReferenceDocuments,
  getDocsRootDocumentRequirements,
  getProjectRootDocumentRequirements,
  getPublicPackageDocumentRequirements,
  getRepoRootDocumentRequirements,
  getWorkspaceRootDocumentRequirements,
  validateDocumentContent,
  validateScriptRequirements,
} from '../../contracts/workspace.js';
import { type Finding, root } from '../../runtime.js';

export async function checkPackageDocumentContracts(
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

    findings.push(...(await checkUnexpectedRootLevelDocs(rel, requirements, ['API.md'])));
  }
  return findings;
}

export async function checkWorkspaceDocumentContracts(
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
      const docRel =
        target.baseDir === '.' ? requirement.path : `${target.baseDir}/${requirement.path}`;
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

export async function checkRootToolingScripts(): Promise<Finding[]> {
  const packageJson = JSON.parse(await readFile(join(root, 'package.json'), 'utf8')) as {
    scripts?: Record<string, string>;
  };
  return validateScriptRequirements(packageJson.scripts ?? {});
}

function checkStructureIdentity(pkg: PublicPackageInfo, content: string): Finding[] {
  const findings: Finding[] = [];
  const identityTokens = structureIdentityTokens(pkg);

  if (!identityTokens.some((token) => content.includes(token))) {
    findings.push({
      severity: 'warning',
      file: `${pkg.rel}/STRUCTURE.md`,
      rule: 'document-contract',
      issue:
        'STRUCTURE.md does not identify the package by its actual package name or workspace path.',
      recommendation:
        'Regenerate the file with `pnpm gen:structure` to normalize package identity.',
    });
  }

  const legacyAlias = detectLegacyStructureAlias(content);
  if (legacyAlias) {
    findings.push({
      severity: 'warning',
      file: `${pkg.rel}/STRUCTURE.md`,
      rule: 'document-contract',
      issue: `STRUCTURE.md still uses legacy tier alias ${legacyAlias} in its title, which conflicts with the canonical workspace path ${pkg.rel}.`,
      recommendation:
        'Prefer the real workspace path and package name over legacy framework/platform/domains aliases.',
    });
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
