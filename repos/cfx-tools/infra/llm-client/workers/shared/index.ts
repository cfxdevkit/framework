import { execFile } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

export const execFileAsync = promisify(execFile);

export const root = process.cwd();
export const workerDir = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
export const artifactsRoot = join(root, 'artifacts', 'llm');
export const configPath = join(artifactsRoot, 'config', 'lemonade.json');
export const defaultBaseUrls = [
  'http://localhost:13305/',
  'http://127.0.0.1:13305/',
  'http://host.docker.internal:13305/',
  'http://host.containers.internal:13305/',
  'http://127.0.0.1:8000/',
];
export const modelPaths = ['/api/v1/models', '/v1/models', '/models'];
export const chatPaths = ['/api/v1/chat/completions', '/v1/chat/completions', '/chat/completions'];
export const repoActions = {
  'docs-upkeep': {
    title: 'Documentation Upkeep',
    defaultPrompt:
      'Review documentation alignment warnings and recommend the smallest repo doc updates. Keep findings first. Focus on docs that should live in the codebase, stale structure notes, missing API docs, and package README gaps.',
    context: [
      'artifacts/llm/reports/docs-alignment.md',
      'docs/README.md',
      'docs/llm-fine-tuning-plan.md',
    ],
  },
  'test-audit': {
    title: 'Test and Precheck Coverage Audit',
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
  },
  'repo-health': {
    title: 'Repository Health',
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
  },
  changeset: {
    title: 'Changeset Readiness',
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
  },
  'release-readiness': {
    title: 'Release Readiness',
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
  },
  'ci-cd': {
    title: 'CI/CD Pipeline Review',
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
  },
  'docs-pipeline': {
    title: 'Docs Pipeline Review',
    defaultPrompt:
      'Review docs build, wiki sync, Docker image, Nextra output, and VPS deploy flow. Find issues that could break www.cfxdevkit.org or make docs drift from generated GitNexus content.',
    context: [
      'repos/cfx-tools/packages/docs-site/package.json',
      'repos/cfx-tools/packages/docs-pipeline/package.json',
      'repos/cfx-tools/packages/docs-pipeline/src/llm/package-pages.ts',
      'repos/cfx-tools/packages/docs-pipeline/src/llm/wiki.ts',
      'repos/cfx-tools/packages/docs-site/Dockerfile',
      '.github/workflows/build-docs.yml',
      '.github/workflows/deploy-docs.yml',
      'infrastructure/ansible/roles/docs/tasks/main.yml',
      'artifacts/llm/reports/docs-alignment.md',
      'artifacts/llm/reports/ci-cd.md',
    ],
    includeChangedFiles: true,
    includeGitDiff: true,
  },
  review: {
    title: 'Code Review',
    defaultPrompt:
      'Review the current git changes. Prioritize bugs, security risks, missing validation, and regressions.',
    context: ['artifacts/llm/reports/review.md', 'SECURITY.md', 'CONTRIBUTING.md'],
    includeGitDiff: true,
  },
  validation: {
    title: 'Validation Selection',
    defaultPrompt:
      'Given the changed files and repository scripts, choose the minimum useful validation commands and explain why.',
    context: ['package.json', 'artifacts/llm/reports/review.md'],
    includeChangedFiles: true,
  },
  commit: {
    title: 'Commit Preparation',
    defaultPrompt: [
      'Analyze the current repository state and prepare a clean commit summary.',
      'Return these sections: Commit message, Commit body, Change comment, Cleanliness checks, Risks, Recommended commands.',
      'Use imperative mood for the commit message, keep the subject under 72 characters, and do not claim a commit was created.',
      'Call out generated/artifact files, unrelated worktree changes, missing validation, GitNexus impact, and Moon changed-file signals.',
    ].join(' '),
    context: ['artifacts/llm/reports/review.md', 'CONTRIBUTING.md', 'SECURITY.md'],
    includeCommitPreflight: true,
  },
};

export const QUALITY_GATES = [
  {
    id: 'lint',
    label: 'Lint',
    cmd: 'pnpm',
    args: ['run', 'lint'],
    required: true,
    timeoutMs: 120000,
  },
  {
    id: 'typecheck',
    label: 'Typecheck',
    cmd: 'pnpm',
    args: ['run', 'typecheck'],
    required: true,
    timeoutMs: 180000,
  },
  {
    id: 'validate:repos',
    label: 'Repo validation',
    cmd: 'node',
    args: ['scripts/validate-repos.mjs'],
    required: true,
    timeoutMs: 30000,
  },
  {
    id: 'build',
    label: 'Build',
    cmd: 'pnpm',
    args: ['exec', 'moon', 'run', ':build', '--concurrency', '4'],
    required: false,
    timeoutMs: 300000,
  },
  {
    id: 'test',
    label: 'Test',
    cmd: 'pnpm',
    args: ['exec', 'moon', 'run', ':test', '--concurrency', '1'],
    required: true,
    timeoutMs: 600000,
  },
];
