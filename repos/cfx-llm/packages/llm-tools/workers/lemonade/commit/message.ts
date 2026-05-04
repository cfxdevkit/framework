// @ts-nocheck
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { createInterface } from 'node:readline';
import { completeCommitAgent, git, readContextFile } from '../completion/index.ts';
import { artifactsRoot, execFileAsync, repoActions, root } from '../shared/index.ts';
import { unique } from '../shared/logging.ts';
import { changedFilesList } from './scope.ts';
import { validateCommitJson } from './validate.ts';

export async function generateCommitMessage(preflightCtx, changelogResults, flags) {
  const changelogSummary = changelogResults
    .filter((r) => r.ok && r.entry)
    .map((r) => `### ${r.scope.label}\nSummary: ${r.summary}\n${r.entry}`)
    .join('\n\n');

  const context = [
    preflightCtx,
    changelogResults.length > 0 ? `--- changelog entries generated ---\n${changelogSummary}` : '',
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
      return { response: retryResponse, commit: fallbackCommitMessage(changelogResults) };
    }
  }
}

export function fallbackCommitMessage(changelogResults) {
  const okResults = changelogResults.filter((result) => result.ok);
  const scopeLabels = okResults.map((result) => result.scope.label);
  const bodyLines = [
    'Generated deterministic fallback commit metadata after the local LLM returned invalid commit JSON.',
    '',
    ...okResults.slice(0, 8).map((result) => `- ${result.scope.label}: ${result.summary}`),
  ];
  if (okResults.length > 8)
    bodyLines.push(`- ${okResults.length - 8} additional scope(s) updated.`);
  return {
    subject: 'refactor: update workspace structure and tooling',
    body: bodyLines.join('\n').trim(),
    filesToStage: [],
    risks: [
      `Fallback commit metadata used for ${scopeLabels.length} scope(s): ${scopeLabels.join(', ')}`,
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

export async function writeCommitReport(response, changelogResults) {
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
      '## Changelog Scopes',
      '',
      ...renderChangelogScopes(changelogResults),
      '',
    ].join('\n'),
    'utf8',
  );
}

function renderChangelogScopes(changelogResults) {
  if (!changelogResults.length) return ['No changed scopes detected.'];
  return changelogResults.flatMap((result) => [
    `### ${result.scope.label}`,
    '',
    result.ok ? result.summary : `Failed: ${result.error}`,
    '',
    result.entry ?? '',
    '',
  ]);
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
