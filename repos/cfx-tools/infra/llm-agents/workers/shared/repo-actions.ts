import { getDocsPipelineReviewContext } from '@cfxdevkit/docs-pipeline';

export type RepoActionMode = 'deterministic' | 'exploratory';

export interface RepoActionUiMetadata {
  readonly statusLabel?: string;
  readonly renderer?: 'text' | 'hud';
}

export interface RepoActionDefinition {
  readonly title: string;
  readonly description: string;
  readonly mode: RepoActionMode;
  readonly defaultPrompt: string;
  readonly context: readonly string[];
  readonly includeChangedFiles?: boolean;
  readonly includeGitDiff?: boolean;
  readonly includeCommitPreflight?: boolean;
  readonly cliAliases?: readonly string[];
  readonly ui?: RepoActionUiMetadata;
}

export const repoActions = {
  'wiki-generate': {
    title: 'Wiki Generation',
    description: 'Generate GitNexus wiki pages using provider-routed LLM.',
    mode: 'deterministic',
    defaultPrompt: '',
    context: [],
    ui: { statusLabel: 'Wiki Generate', renderer: 'text' },
  },
  'docs-api': {
    title: 'API Documentation Enrichment',
    description: 'Generate API descriptions and examples for public package APIs.',
    mode: 'deterministic',
    defaultPrompt:
      'Enrich the API.md skeleton for this package. For each exported symbol, add a concise one-line description as a comment. Add a brief usage example per sub-path. Do not change type signatures, the sub-paths table, or the api-hash footer.',
    context: ['artifacts/llm/reports/docs-alignment.md'],
    ui: { statusLabel: 'Docs API', renderer: 'text' },
  },
  'readme-upkeep': {
    title: 'README Upkeep',
    description: 'Fill README placeholders with minimal repo-aware prose and examples.',
    mode: 'deterministic',
    defaultPrompt:
      'Improve the README.md for this package. Fill in placeholder sections (Usage, Purpose). Add a minimal code example. Keep the Install and Sub-paths sections exactly as-is. Keep it concise.',
    context: ['artifacts/llm/reports/docs-alignment.md'],
    ui: { statusLabel: 'README', renderer: 'text' },
  },
  'package-pages': {
    title: 'Package Page Enrichment',
    description: 'Enrich docs-site package pages with descriptions and examples.',
    mode: 'deterministic',
    defaultPrompt:
      'Improve the MDX docs-site page for this package. Fill in sub-path table descriptions and add TypeScript code examples. Keep frontmatter, install tabs, and sub-paths table structure exactly as-is.',
    context: ['artifacts/llm/reports/docs-alignment.md'],
    ui: { statusLabel: 'Package Pages', renderer: 'text' },
  },
  'structure-upkeep': {
    title: 'STRUCTURE.md Generation',
    description: 'Generate deterministic STRUCTURE documentation for a package.',
    mode: 'deterministic',
    defaultPrompt:
      'Generate a STRUCTURE.md for this package. Document each significant file and directory with a short inline description. Use a code block for the tree.',
    context: [],
    ui: { statusLabel: 'Structure', renderer: 'text' },
  },
  'test-audit': {
    title: 'Test and Precheck Coverage Audit',
    description: 'Assess missing tests and validation coverage for current changes.',
    mode: 'exploratory',
    defaultPrompt:
      'Assess whether the changed code has meaningful tests and prechecks. Recommend the smallest additional test, lint, typecheck, build, security, GitNexus, or Moon validation that would catch important regressions as the codebase grows. Do not invent coverage that is not visible in context.',
    context: [
      'package.json',
      '.moon/workspace.yml',
      '.moon/tasks/node.yml',
      'artifacts/llm/reports/review.md',
      'artifacts/llm/reports/eval.md',
      'CONTRIBUTING.md',
    ],
    includeChangedFiles: true,
    includeGitDiff: true,
    cliAliases: ['test-audit'],
    ui: { statusLabel: 'Test Audit', renderer: 'text' },
  },
  'repo-health': {
    title: 'Repository Health',
    description: 'Summarize repo drift, automation gaps, and next validations.',
    mode: 'exploratory',
    defaultPrompt:
      'Summarize repository health for a human maintainer. Focus on documentation drift, missing automation, validation blind spots, dependency or package-boundary risk, and which local LLM commands should be run next.',
    context: [
      'README.md',
      'ARCHITECTURE.md',
      'artifacts/llm/reports/docs-alignment.md',
      'artifacts/llm/reports/review.md',
      'artifacts/llm/reports/eval.md',
      'SECURITY-FINDINGS.md',
    ],
    includeChangedFiles: true,
    cliAliases: ['health'],
    ui: { statusLabel: 'Repo Health', renderer: 'text' },
  },
  changeset: {
    title: 'Changeset Readiness',
    description: 'Review whether current publishable changes need or match Changesets.',
    mode: 'exploratory',
    defaultPrompt:
      'Review the current changes for release relevance. Identify which publishable packages need a Changeset, whether an existing .changeset entry is sufficient, and whether bump levels and release notes match the public behavior changed. Do not suggest direct CHANGELOG edits.',
    context: [
      '.changeset/config.json',
      'artifacts/llm/reports/review.md',
      'package.json',
      'scripts/publish-packages.mjs',
      '.github/workflows/changeset-release.yml',
    ],
    includeChangedFiles: true,
    includeGitDiff: true,
    cliAliases: ['changeset'],
    ui: { statusLabel: 'Changeset', renderer: 'text' },
  },
  'release-readiness': {
    title: 'Release Readiness',
    description: 'Review publish and release assumptions before release execution.',
    mode: 'exploratory',
    defaultPrompt:
      'Review the Changesets release flow, package publish helper, and npm provenance assumptions. Find blockers before merging the release PR or manually running the release workflow. Focus on package versions, publishability, OIDC, ignored packages, and validation commands.',
    context: [
      '.changeset/config.json',
      '.github/workflows/changeset-release.yml',
      '.github/workflows/release.yml',
      'scripts/publish-packages.mjs',
      'package.json',
      'artifacts/llm/reports/ci-cd.md',
      'artifacts/llm/reports/eval.md',
    ],
    includeChangedFiles: true,
    includeGitDiff: true,
    cliAliases: ['release'],
    ui: { statusLabel: 'Release', renderer: 'text' },
  },
  'ci-cd': {
    title: 'CI/CD Pipeline Review',
    description: 'Review workflow, deploy, and release pipeline risk.',
    mode: 'exploratory',
    defaultPrompt:
      'Review CI/CD, docs image publishing, docs deploy, release, security, and VPS deployment wiring. Prioritize concrete failure modes, missing secrets, unsafe assumptions, and the minimum validation commands to run next.',
    context: [
      '.github/workflows/build-docs.yml',
      '.github/workflows/deploy-docs.yml',
      '.github/workflows/changeset-release.yml',
      '.github/workflows/release.yml',
      '.github/workflows/security.yml',
      'infrastructure/ansible/vars/all.yml',
      'artifacts/llm/reports/ci-cd.md',
    ],
    includeChangedFiles: true,
    includeGitDiff: true,
    cliAliases: ['ci-cd'],
    ui: { statusLabel: 'CI/CD', renderer: 'text' },
  },
  'docs-pipeline': {
    title: 'Docs Pipeline Review',
    description: 'Review docs build, wiki sync, image, and deploy flow risk.',
    mode: 'exploratory',
    defaultPrompt:
      'Review docs build, wiki sync, Docker image, Nextra output, and VPS deploy flow. Find issues that could break www.cfxdevkit.org or make docs drift from generated GitNexus content.',
    context: getDocsPipelineReviewContext(),
    includeChangedFiles: true,
    includeGitDiff: true,
    cliAliases: ['docs-pipeline'],
    ui: { statusLabel: 'Docs Pipeline', renderer: 'text' },
  },
  review: {
    title: 'Code Review',
    description: 'Review changed code for regressions, risks, and validation gaps.',
    mode: 'exploratory',
    defaultPrompt:
      'Review the current git changes. Prioritize bugs, security risks, missing validation, and regressions.',
    context: ['artifacts/llm/reports/review.md', 'SECURITY.md', 'CONTRIBUTING.md'],
    includeGitDiff: true,
    cliAliases: ['review'],
    ui: { statusLabel: 'Review', renderer: 'text' },
  },
  validation: {
    title: 'Validation Selection',
    description: 'Choose the minimum useful validation commands for current changes.',
    mode: 'exploratory',
    defaultPrompt:
      'Given the changed files and repository scripts, choose the minimum useful validation commands and explain why.',
    context: ['package.json', 'artifacts/llm/reports/review.md'],
    includeChangedFiles: true,
    cliAliases: ['validation'],
    ui: { statusLabel: 'Validation', renderer: 'text' },
  },
  commit: {
    title: 'Commit Preparation',
    description: 'Prepare a clean commit summary with repo-aware risk reporting.',
    mode: 'exploratory',
    defaultPrompt: [
      'Analyze the current repository state and prepare a clean commit summary.',
      'Return these sections: Commit message, Commit body, Change comment, Cleanliness checks, Risks, Recommended commands.',
      'Use imperative mood for the commit message, keep the subject under 72 characters, and do not claim a commit was created.',
      'Call out generated/artifact files, unrelated worktree changes, missing validation, GitNexus impact, and Moon changed-file signals.',
    ].join(' '),
    context: ['artifacts/llm/reports/review.md', 'CONTRIBUTING.md', 'SECURITY.md'],
    includeCommitPreflight: true,
    cliAliases: ['commit'],
    ui: { statusLabel: 'Commit', renderer: 'hud' },
  },
} as const satisfies Record<string, RepoActionDefinition>;

export type RepoActionName = keyof typeof repoActions;

export function getRepoAction(name: RepoActionName): RepoActionDefinition {
  return repoActions[name];
}

export function listRepoActions(): readonly [RepoActionName, RepoActionDefinition][] {
  return Object.entries(repoActions) as readonly [RepoActionName, RepoActionDefinition][];
}
