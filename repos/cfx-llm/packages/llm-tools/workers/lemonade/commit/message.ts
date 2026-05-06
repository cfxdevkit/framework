// @ts-nocheck
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { createInterface } from 'node:readline';
import { completeCommitAgent, git, readContextFile } from '../completion/index.ts';
import { artifactsRoot, execFileAsync, repoActions, root } from '../shared/index.ts';
import { unique } from '../shared/logging.ts';
import { changedFilesList } from './scope.ts';
import { validateCommitJson } from './validate.ts';

export async function generateCommitMessage(preflightCtx, changesetPlan, flags) {
  const changesetSummary = renderChangesetGuidance(changesetPlan).join('\n');

  const context = [
    preflightCtx,
    `--- changeset guidance ---\n${changesetSummary}`,
    await readContextFile('CONTRIBUTING.md'),
  ]
    .filter(Boolean)
    .join('\n\n')
    .slice(0, flags.quick ? 12000 : 60000);

  const systemPrompt = [
    'You prepare commit metadata for a local deterministic git harness.',
    'Return strict JSON only, with no markdown fence and no explanatory text.',
    'Schema: {"subject":"conventional commit subject under 72 chars","bodyLines":["commit body line"],"filesToStage":["optional relative paths"],"risks":["risk or empty"]}.',
    'Use bodyLines instead of a multiline string so every commit body line is a separate JSON string.',
    'The subject must start with one of feat, fix, chore, docs, refactor, test, style, perf, ci, build, or revert.',
    'Do not claim the commit already happened.',
  ].join(' ');
  const userPrompt = `${context}\n\nTask:\n${flags.prompt || repoActions.commit.defaultPrompt}`;
  const response = await completeCommitAgent({
    action: 'commit',
    flags,
    systemPrompt,
    userPrompt,
    maxTokens: flags.quick ? 512 : 1400,
  });
  try {
    return { response, commit: validateCommitJson(response.content) };
  } catch {
    const retryResponse = await completeCommitAgent({
      action: 'commit',
      flags,
      systemPrompt: `${systemPrompt} The previous response was invalid. Return only one compact valid JSON object.`,
      userPrompt: [
        'Previous invalid response excerpt:',
        response.content.slice(0, 1200),
        '',
        'Regenerate the commit JSON. Keep bodyLines short. Use a conventional commit subject.',
        '',
        userPrompt.slice(0, flags.quick ? 8000 : 30000),
      ].join('\n'),
      maxTokens: flags.quick ? 512 : 1200,
    });
    try {
      return { response: retryResponse, commit: validateCommitJson(retryResponse.content) };
    } catch {
      return { response: retryResponse, commit: fallbackCommitMessage(changesetPlan) };
    }
  }
}

export function fallbackCommitMessage(changesetPlan) {
  const packageNames = changesetPlan?.packages?.map((pkg) => pkg.name) ?? [];
  const changesets = changesetPlan?.changesets ?? [];
  const bodyLines = [
    'Generated deterministic fallback commit metadata after the local LLM returned invalid commit JSON.',
    '',
    changesetPlan?.summary
      ? `- Release intent: ${changesetPlan.summary}`
      : '- Release intent: not detected',
    ...changesets
      .slice(0, 8)
      .map((entry) => `- ${entry.packageName}: ${entry.bump} - ${entry.summary}`),
  ];
  if (changesets.length > 8)
    bodyLines.push(
      `- ${changesets.length - 8} additional changeset entr${changesets.length - 8 === 1 ? 'y' : 'ies'}.`,
    );
  return {
    subject: changesetPlan?.releaseRelevant
      ? 'chore: update release-ready package changes'
      : 'refactor: update workspace structure and tooling',
    body: bodyLines.join('\n').trim(),
    filesToStage: [],
    risks: [
      packageNames.length > 0
        ? `Fallback commit metadata used for package changes: ${packageNames.join(', ')}`
        : 'Fallback commit metadata used without publishable package changes.',
    ],
  };
}

// ─── Confirmation + commit execution ─────────────────────────────────────────

export function printProposedCommit(subject, body) {
  console.log('\n  ┌──────────────────────────────────────────────────────────────');
  console.log(`  │ ${subject}`);
  if (body) {
    console.log('  │');
    for (const line of body.split('\n').slice(0, 20)) {
      console.log(`  │ ${line}`);
    }
  }
  console.log('  └──────────────────────────────────────────────────────────────');
}

export async function writeCommitReport(response, changesetPlan) {
  const reportPath = join(artifactsRoot, 'reports', 'lemonade-commit.md');
  await mkdir(dirname(reportPath), { recursive: true });
  await writeFile(
    reportPath,
    [
      '# Lemonade Commit',
      '',
      `Generated: ${response.generatedAt}`,
      `Model: ${response.model}`,
      `Base URL: ${response.baseUrl}`,
      '',
      '## Commit JSON',
      '',
      response.content,
      '',
      '## Changeset Guidance',
      '',
      ...renderChangesetGuidance(changesetPlan),
      '',
    ].join('\n'),
    'utf8',
  );
}

function renderChangesetGuidance(changesetPlan) {
  if (!changesetPlan) return ['No changeset guidance generated.'];
  const lines = [
    `Release relevant: ${changesetPlan.releaseRelevant ? 'yes' : 'no'}`,
    `Summary: ${changesetPlan.summary}`,
    '',
  ];
  if (changesetPlan.changedChangesets?.length) {
    lines.push(
      'Existing changesets:',
      '',
      ...changesetPlan.changedChangesets.map((file) => `- ${file}`),
      '',
    );
  }
  if (changesetPlan.packages?.length) {
    lines.push(
      'Changed publishable packages:',
      '',
      ...changesetPlan.packages.map((pkg) => `- ${pkg.name} (${pkg.dir})`),
      '',
    );
  }
  if (changesetPlan.changesets?.length) {
    lines.push('Suggested entries:', '');
    for (const entry of changesetPlan.changesets) {
      lines.push(`- ${entry.packageName}: ${entry.bump} - ${entry.summary}`);
    }
    lines.push('');
  }
  if (changesetPlan.risks?.length) {
    lines.push('Risks:', '', ...changesetPlan.risks.map((risk) => `- ${risk}`), '');
  }
  return lines;
}

export async function confirmPrompt(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(`\n  ${question}`, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() !== 'n');
    });
  });
}

export async function executeCommit(subject, body, filesToStage) {
  if (filesToStage.length === 0) throw new Error('No files selected for staging.');
  await execFileAsync('git', ['add', '--', ...filesToStage], { cwd: root });
  const messageArgs = body ? ['-m', subject, '-m', body] : ['-m', subject];
  await execFileAsync('git', ['commit', ...messageArgs], { cwd: root });
  return git(['rev-parse', '--short', 'HEAD']);
}

export async function resolveFilesToStage(initialFiles, generatedFiles, modelFiles = []) {
  const requested = [...initialFiles, ...generatedFiles, ...modelFiles];
  const dirty = new Set(await changedFilesList());
  return unique(requested).filter((file) => dirty.has(file));
}

export async function assertNoUnexpectedChanges(expectedFiles) {
  const expected = new Set(expectedFiles);
  const dirty = await changedFilesList();
  const unexpected = dirty.filter((file) => !expected.has(file));
  if (unexpected.length > 0) {
    throw new Error(
      [
        'Unexpected working tree changes appeared during commit pipeline:',
        ...unexpected.map((file) => `  - ${file}`),
        'Review them or rerun the command after staging scope is clear.',
      ].join('\n'),
    );
  }
}
