import type { Finding, Severity } from '../runtime.js';
import {
  docsRootDocumentRequirements,
  documentationUpkeepExcludedPrefixes,
  examplesProjectDocumentRequirements,
  packageReadmeChecks,
  projectRootDocumentRequirements,
  repoRootDocumentRequirements,
  structureChecks,
  workspaceRootDocumentRequirements,
} from './workspace-data.js';
import { rootToolingScriptRequirements } from './workspace-scripts.js';

export type DocumentShapeCheck = {
  readonly id: string;
  readonly description: string;
  readonly matcher: RegExp;
};

export type DocumentRequirement = {
  readonly path: string;
  readonly severity: Severity;
  readonly description: string;
  readonly recommendation: string;
  readonly checks?: readonly DocumentShapeCheck[];
};

export type ScriptRequirement = {
  readonly name: string;
  readonly expected: string;
  readonly severity: Severity;
  readonly description: string;
};

export type DocumentationUpkeepOptions = {
  readonly docsOnly?: boolean;
  readonly scopes?: readonly string[];
};

export { rootToolingScriptRequirements };

export function getWorkspaceRootDocumentRequirements(): readonly DocumentRequirement[] {
  return workspaceRootDocumentRequirements;
}

export function getDocsRootDocumentRequirements(): readonly DocumentRequirement[] {
  return docsRootDocumentRequirements;
}

export function getRepoRootDocumentRequirements(): readonly DocumentRequirement[] {
  return repoRootDocumentRequirements;
}

export function getProjectRootDocumentRequirements(
  projectRel: string,
): readonly DocumentRequirement[] {
  return projectRel === 'projects/examples'
    ? examplesProjectDocumentRequirements
    : projectRootDocumentRequirements;
}

export function getPublicPackageDocumentRequirements(_rel: string): readonly DocumentRequirement[] {
  const requirements: DocumentRequirement[] = [
    {
      path: 'README.md',
      severity: 'warning',
      description: 'package overview, usage, and public-surface guidance',
      recommendation: 'Run `pnpm gen:readme` and then enrich the package README if needed.',
      checks: packageReadmeChecks,
    },
    {
      path: 'STRUCTURE.md',
      severity: 'warning',
      description: 'package structure reference and codebase map',
      recommendation:
        'Run `pnpm gen:structure` for the deterministic skeleton, then optionally `pnpm tooling -- docs enrich structure` for prose enrichment.',
      checks: structureChecks,
    },
  ];

  return requirements;
}

export function validateDocumentContent(
  requirement: DocumentRequirement,
  content: string,
): string[] {
  return (requirement.checks ?? [])
    .filter((check) => !check.matcher.test(content))
    .map((check) => check.description);
}

export function findUnexpectedReferenceDocuments(
  fileNames: readonly string[],
  requirements: readonly Pick<DocumentRequirement, 'path'>[],
  allowedNames: readonly string[] = [],
): string[] {
  const expected = new Set([
    ...requirements.map((requirement) => requirement.path),
    ...allowedNames,
  ]);

  return [...fileNames]
    .filter((fileName) => fileName.endsWith('.md'))
    .filter((fileName) => !expected.has(fileName))
    .sort((left, right) => left.localeCompare(right));
}

export function isDocumentationUpkeepPath(
  path: string,
  options: DocumentationUpkeepOptions = {},
): boolean {
  const normalizedPath = normalizeDocumentationUpkeepPath(path);
  if (!normalizedPath.endsWith('.md') && !normalizedPath.endsWith('.mdx')) return false;
  if (documentationUpkeepExcludedPrefixes.some((prefix) => normalizedPath.startsWith(prefix))) {
    return false;
  }

  const scopeFilters = (options.scopes ?? []).map(normalizeDocumentationUpkeepPath).filter(Boolean);
  if (scopeFilters.length > 0) {
    return scopeFilters.some(
      (scope) => normalizedPath === scope || normalizedPath.startsWith(`${scope}/`),
    );
  }

  if (options.docsOnly) {
    return normalizedPath.startsWith('docs/');
  }

  if (normalizedPath.startsWith('docs/') || normalizedPath.startsWith('infrastructure/')) {
    return true;
  }

  if (
    workspaceRootDocumentRequirements.some((requirement) => requirement.path === normalizedPath)
  ) {
    return true;
  }

  if (/^repos\/[^/]+\/README\.md$/.test(normalizedPath)) {
    return true;
  }

  if (/^projects\/[^/]+\/(README|STRUCTURE)\.md$/.test(normalizedPath)) {
    return true;
  }

  return false;
}

function normalizeDocumentationUpkeepPath(path: string): string {
  return path.replace(/^\.\//, '').replace(/\\/g, '/').replace(/\/$/, '');
}

export function validateScriptRequirements(
  actualScripts: Record<string, string | undefined>,
  requirements: readonly ScriptRequirement[] = rootToolingScriptRequirements,
): Finding[] {
  const findings: Finding[] = [];
  for (const requirement of requirements) {
    const actual = actualScripts[requirement.name];
    if (!actual) {
      findings.push({
        severity: requirement.severity,
        file: 'package.json',
        rule: 'tooling-script-contract',
        issue: `Root package.json is missing script ${requirement.name} for ${requirement.description}.`,
        recommendation: `Add "${requirement.name}": "${requirement.expected}" to the root package.json scripts.`,
      });
      continue;
    }

    if (actual !== requirement.expected) {
      findings.push({
        severity: requirement.severity,
        file: 'package.json',
        rule: 'tooling-script-contract',
        issue: `Root script ${requirement.name} is out of sync with the tooling contract.`,
        recommendation: `Expected "${requirement.expected}" but found "${actual}".`,
      });
    }
  }
  return findings;
}
