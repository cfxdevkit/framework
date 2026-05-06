// @ts-nocheck
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  printSummary,
  renderFindings,
  root,
  writeJsonReport,
  writeMarkdownReport,
} from './runtime/index.ts';

const REQUIRED_FILES = [
  '.github/workflows/build-docs.yml',
  '.github/workflows/deploy-docs.yml',
  '.github/workflows/changeset-release.yml',
  '.github/workflows/release.yml',
  'repos/cfx-tools/packages/docs-site/Dockerfile',
  'repos/cfx-tools/packages/docs-site/scripts/sync-wiki.mjs',
  'scripts/publish-packages.mjs',
  'infrastructure/ansible/inventory.ini',
  'infrastructure/ansible/vars/all.yml',
  'infrastructure/ansible/roles/docs/tasks/main.yml',
];

export async function runCiCdAgent(opts = {}) {
  const findings = [];
  for (const file of REQUIRED_FILES) {
    if (!existsSync(join(root, file))) {
      findings.push({
        severity: 'error',
        file,
        issue: 'required CI/CD or deployment file is missing',
        recommendation:
          'Restore the file or update the CI/CD plan and scripts to match the new location.',
      });
    }
  }

  await checkContains(findings, '.github/workflows/build-docs.yml', [
    ['ghcr.io/', 'docs image should publish to GHCR'],
    ['/docs-site', 'docs image should use the docs-site image name'],
    ['docker/build-push-action@v6', 'docs workflow should use Buildx image publishing'],
    [
      'node repos/cfx-tools/packages/docs-site/scripts/sync-wiki.mjs',
      'docs workflow should sync generated wiki content before building',
    ],
  ]);
  await checkContains(findings, '.github/workflows/deploy-docs.yml', [
    ['VPS_HOST', 'deploy workflow should be driven by VPS secrets'],
    ['/opt/apps/docs', 'deploy workflow should update the docs compose app directory'],
    [
      'docker compose up -d --remove-orphans',
      'deploy workflow should converge the compose service',
    ],
  ]);
  await checkContains(findings, '.github/workflows/changeset-release.yml', [
    ['changesets/action@v1', 'release PR workflow should be Changesets owned'],
    ['node scripts/publish-packages.mjs', 'release workflow should use the OIDC publish helper'],
  ]);
  await checkContains(findings, '.github/workflows/release.yml', [
    [
      'node scripts/publish-packages.mjs',
      'manual release workflow should use the OIDC publish helper',
    ],
  ]);
  await checkContains(findings, 'infrastructure/ansible/vars/all.yml', [
    ['www.cfxdevkit.org', 'docs deployment domain should match the current VPS decision'],
  ]);

  const report = {
    generatedAt: new Date().toISOString(),
    status: findings.some((finding) => finding.severity === 'error') ? 'error' : 'ok',
    requiredFiles: REQUIRED_FILES,
    findings,
  };
  await writeJsonReport('reports/ci-cd.json', report);
  await writeMarkdownReport('reports/ci-cd.md', renderFindings('CI/CD Readiness', findings));
  if (!opts.silent) printSummary('llm:ci', [report]);
  return { agent: 'ci', status: report.status, findings: findings.length };
}

async function checkContains(findings, file, expectations) {
  let content = '';
  try {
    content = await readFile(join(root, file), 'utf8');
  } catch {
    return;
  }
  for (const [needle, issue] of expectations) {
    if (!content.includes(needle)) {
      findings.push({
        severity: 'warning',
        file,
        issue,
        recommendation: `Expected to find: ${needle}`,
      });
    }
  }
}
