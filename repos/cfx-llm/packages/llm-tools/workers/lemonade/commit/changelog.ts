// @ts-nocheck
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { completeCommitAgent, git } from '../completion/index.ts';
import { root } from '../shared/index.ts';
import { validateChangelogJson } from './validate.ts';

export async function generateChangelogEntry(scope, flags) {
  const trackedFiles = scope.files.filter((f) => !scope.untrackedSet.has(f));
  const untrackedFiles = scope.files.filter((f) => scope.untrackedSet.has(f));

  let diff = '';
  if (scope.scopeGlob) {
    diff = await git(['diff', 'HEAD', '--', scope.scopeGlob]).catch(() => '');
  } else if (trackedFiles.length > 0) {
    diff = await git(['diff', 'HEAD', '--', ...trackedFiles]).catch(() => '');
  }

  const diffCtx = [
    diff.slice(0, 14000) || '(no tracked diff)',
    untrackedFiles.length > 0
      ? `New untracked files:\n${untrackedFiles.map((f) => `  + ${f}`).join('\n')}`
      : '',
  ]
    .filter(Boolean)
    .join('\n\n');

  const today = new Date().toISOString().slice(0, 10);
  const systemPrompt = [
    'You are a changelog writer for a TypeScript monorepo.',
    'Return strict JSON only, with no markdown fence and no explanatory text.',
    'Schema: {"summary":"one sentence","entryLines":["markdown line"],"risks":["risk or empty"]}.',
    'Use entryLines instead of a multiline string so every markdown line is a separate JSON string.',
    'The entryLines must form a Keep-a-Changelog style entry with a date heading and only factual bullets under Added, Changed, Fixed, or Removed.',
  ].join(' ');
  const userPrompt = [
    `Scope: ${scope.label}`,
    `Date: ${today}`,
    `Changed files: ${scope.files.join(', ')}`,
    '',
    'Git diff:',
    diffCtx,
    '',
    'Write the JSON changelog analysis for this scope.',
  ].join('\n');
  const response = await completeCommitAgent({
    action: 'changelog',
    flags,
    systemPrompt,
    userPrompt,
    maxTokens: flags.quick ? 384 : 800,
  });
  try {
    return validateChangelogJson(response.content, scope.label);
  } catch {
    const retryResponse = await completeCommitAgent({
      action: 'changelog',
      flags,
      systemPrompt: `${systemPrompt} The previous response was invalid or incomplete. Return exactly one compact JSON object. Do not include markdown.`,
      userPrompt: [
        'Previous invalid response excerpt:',
        response.content.slice(0, 900),
        '',
        userPrompt,
      ].join('\n'),
      maxTokens: flags.quick ? 512 : 900,
    });
    try {
      return validateChangelogJson(retryResponse.content, scope.label);
    } catch {
      return fallbackChangelogEntry(scope, today);
    }
  }
}

export function fallbackChangelogEntry(scope, today) {
  const changedFiles = scope.files.slice(0, 12);
  const extraCount = Math.max(scope.files.length - changedFiles.length, 0);
  const fileSummary =
    changedFiles.length > 0
      ? `${changedFiles.join(', ')}${extraCount > 0 ? `, and ${extraCount} more` : ''}`
      : 'workspace metadata';
  return {
    summary: `Updated ${scope.label} files: ${fileSummary}.`,
    entry: [
      `## ${today}`,
      '',
      '### Changed',
      '',
      `- Updated ${scope.label} files: ${fileSummary}.`,
    ].join('\n'),
    risks: ['Generated from changed file list after local LLM returned invalid changelog JSON.'],
  };
}

export async function appendToChangelog(scope, entry) {
  const changelogPath = join(root, scope.changelogPath);
  let existing = '';
  try {
    existing = await readFile(changelogPath, 'utf8');
  } catch {
    existing = `# Changelog\n\nAll notable changes to this package are documented here.\n\n`;
  }
  // Insert after the first heading block (# Changelog + optional subtitle lines)
  const headingEnd = existing.search(/\n##\s|\n\n(?!#)/);
  const insertPos = headingEnd > 0 ? headingEnd + 1 : existing.indexOf('\n') + 1;
  const updated = `${existing.slice(0, insertPos)}\n${entry.trim()}\n\n${existing.slice(insertPos)}`;
  await mkdir(dirname(changelogPath), { recursive: true });
  await writeFile(changelogPath, updated, 'utf8');
}

// ─── Commit message generation ────────────────────────────────────────────────
