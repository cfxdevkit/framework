import type { DocumentRequirement, DocumentShapeCheck } from '../workspace.js';

export const packageReadmeChecks: readonly DocumentShapeCheck[] = [
  {
    id: 'install',
    description: 'Install section',
    matcher: /##\s+install/i,
  },
  {
    id: 'usage',
    description: 'Usage section',
    matcher: /##\s+usage/i,
  },
  {
    id: 'api-reference',
    description: 'API reference link',
    matcher: /API\.md/i,
  },
  {
    id: 'tier',
    description: 'Tier section',
    matcher: /tier\s+\d/i,
  },
];

export const structureChecks: readonly DocumentShapeCheck[] = [
  {
    id: 'tree-block',
    description: 'directory tree code block',
    matcher: /```[\s\S]*?```/,
  },
  {
    id: 'workspace-path',
    description: 'workspace path line',
    matcher: /Workspace path:\s*`[^`]+`/,
  },
];

export const workspaceRootDocumentRequirements: readonly DocumentRequirement[] = [
  {
    path: 'AGENTS.md',
    severity: 'warning',
    description: 'agent workflow and repository-specific guardrails',
    recommendation:
      'Keep AGENTS.md present at the workspace root while agent workflows depend on it.',
  },
  {
    path: 'README.md',
    severity: 'warning',
    description: 'workspace overview and entrypoint documentation',
    recommendation: 'Keep the root README.md as the monorepo landing page.',
  },
  {
    path: 'ARCHITECTURE.md',
    severity: 'warning',
    description: 'workspace-level architecture overview',
    recommendation: 'Keep ARCHITECTURE.md aligned with the current monorepo topology.',
  },
  {
    path: 'CHANGELOG.md',
    severity: 'warning',
    description: 'workspace-level release history',
    recommendation:
      'Keep CHANGELOG.md present at the workspace root if workspace-level release notes are tracked here.',
  },
  {
    path: 'CLAUDE.md',
    severity: 'warning',
    description: 'assistant configuration and workflow guidance',
    recommendation:
      'Keep CLAUDE.md present while the repository relies on it for agent workflow configuration.',
  },
  {
    path: 'CONTRIBUTING.md',
    severity: 'warning',
    description: 'contribution workflow and development guidance',
    recommendation: 'Keep CONTRIBUTING.md present at the workspace root.',
  },
  {
    path: 'OPENSPEC.md',
    severity: 'warning',
    description: 'OpenSpec process overview and entrypoint',
    recommendation:
      'Keep OPENSPEC.md present at the workspace root while OpenSpec remains part of the delivery workflow.',
  },
  {
    path: 'SECURITY.md',
    severity: 'warning',
    description: 'security disclosure and policy guidance',
    recommendation: 'Keep SECURITY.md present at the workspace root.',
  },
];

export const docsRootDocumentRequirements: readonly DocumentRequirement[] = [
  {
    path: 'README.md',
    severity: 'warning',
    description: 'docs area overview and navigation guidance',
    recommendation: 'Keep docs/README.md present and aligned with the checked-in docs tree.',
  },
  {
    path: 'STRUCTURE.md',
    severity: 'warning',
    description: 'docs area structure reference',
    recommendation: 'Keep docs/STRUCTURE.md present and aligned with the checked-in docs tree.',
    checks: structureChecks,
  },
  {
    path: 'keystore-docker.md',
    severity: 'warning',
    description: 'keystore container workflow reference',
    recommendation:
      'Keep the keystore Docker guide in the docs root while that workflow remains supported.',
  },
  {
    path: 'legacy-migration-refactor-audit.md',
    severity: 'warning',
    description: 'legacy migration audit reference',
    recommendation:
      'Keep the legacy migration audit document in the docs root while it remains part of the checked-in evidence set.',
  },
  {
    path: 'llm-automation-agents.md',
    severity: 'warning',
    description: 'llm automation agent reference',
    recommendation:
      'Keep the LLM automation agent guide in the docs root while that tooling remains active.',
  },
  {
    path: 'llm-fine-tuning-plan.md',
    severity: 'warning',
    description: 'llm fine-tuning planning reference',
    recommendation:
      'Keep the LLM fine-tuning plan in the docs root while it remains part of the maintained docs set.',
  },
];

export const repoRootDocumentRequirements: readonly DocumentRequirement[] = [
  {
    path: 'README.md',
    severity: 'warning',
    description: 'slice-level overview for the repo family',
    recommendation: 'Keep a README.md at each repos/cfx-* root describing that slice.',
  },
];

export const projectRootDocumentRequirements: readonly DocumentRequirement[] = [
  {
    path: 'README.md',
    severity: 'warning',
    description: 'project-level overview and local run guidance',
    recommendation: 'Keep a README.md at each project root.',
  },
  {
    path: 'STRUCTURE.md',
    severity: 'warning',
    description: 'project-level structure reference',
    recommendation:
      'Keep STRUCTURE.md present for project roots with checked-in application topology.',
    checks: structureChecks,
  },
];

export const examplesProjectDocumentRequirements: readonly DocumentRequirement[] = [
  {
    path: 'README.md',
    severity: 'warning',
    description: 'examples project overview',
    recommendation: 'Keep a README.md at the examples project root.',
  },
];

export const documentationUpkeepExcludedPrefixes = [
  '.changeset/',
  '.moon/',
  'artifacts/',
  'openspec/',
  'plan/',
  'repos/cfx-tools/packages/docs-site/content/wiki/',
] as const;
