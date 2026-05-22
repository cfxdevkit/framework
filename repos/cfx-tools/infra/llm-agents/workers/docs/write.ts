import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { artifactsRoot, root } from '../shared/index.ts';
import { logInfo } from '../shared/logging.ts';

export async function applyDocsUpkeepUpdates(scope, result) {
  const allowed = new Set(scope.files);
  let applied = 0;
  for (const replacement of result.replacements ?? []) {
    if (!allowed.has(replacement.path)) {
      logInfo(`    ! skipped replacement outside scope: ${replacement.path}`);
      continue;
    }
    const path = join(root, replacement.path);
    const current = await readFile(path, 'utf8');
    const occurrences = current.split(replacement.oldText).length - 1;
    if (occurrences !== 1) {
      logInfo(`    ! skipped non-unique replacement in ${replacement.path}`);
      continue;
    }
    await writeFile(path, current.replace(replacement.oldText, replacement.newText), 'utf8');
    applied++;
  }
  for (const update of result.fileUpdates ?? []) {
    if (!allowed.has(update.path)) {
      logInfo(`    ! skipped update outside scope: ${update.path}`);
      continue;
    }
    await writeFile(join(root, update.path), update.content, 'utf8');
    applied++;
  }
  result.updatedFiles = applied;
  if (applied > 0) logInfo(`    updated ${applied} markdown file(s)`);
}

export async function writeDocsUpkeepScopeArtifact(scope, result) {
  const filePath = join(artifactsRoot, 'reports', 'docs-upkeep', `${artifactSlug(scope.label)}.md`);
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(
    filePath,
    [
      `# Docs upkeep: ${scope.label}`,
      '',
      `Generated: ${new Date().toISOString()}`,
      `Files: ${scope.files.join(', ')}`,
      `Updated files: ${result.updatedFiles ?? 0}`,
      '',
      result.artifact,
      '',
      '## Follow-ups',
      '',
      ...(result.followups.length ? result.followups.map((item) => `- ${item}`) : ['- None.']),
      '',
    ].join('\n'),
    'utf8',
  );
}

export async function writeDocsUpkeepIndex(results, flags) {
  const path = join(artifactsRoot, 'reports', 'docs-upkeep.md');
  const lines = [
    '# Documentation Upkeep',
    '',
    `Generated: ${new Date().toISOString()}`,
    `Mode: ${flags.quick ? 'quick' : 'full'}`,
    `Scope: ${flags.docsOnly ? 'docs/' : 'arch-check managed documentation'}`,
    `Write mode: ${flags.write ? 'yes' : 'no'}`,
    'Processing order: main-folder batches, leaf-to-root inside each batch, then workspace root',
    'Context flow: child artifacts are shared only inside the current main folder; root receives compact main-folder summaries',
    '',
    '## Folder Results',
    '',
  ];
  for (const result of results) {
    const artifact = `artifacts/llm/reports/docs-upkeep/${artifactSlug(result.scope.label)}.md`;
    lines.push(
      `- ${result.ok ? 'ok' : 'error'} ${result.scope.label}: ${result.ok ? result.summary : result.error}`,
      `  - Artifact: ${artifact}`,
      `  - Updated files: ${result.updatedFiles ?? 0}`,
    );
  }
  const followups = results.flatMap((result) =>
    result.ok ? result.followups.map((item) => ({ scope: result.scope.label, item })) : [],
  );
  lines.push('', '## Consolidated Follow-ups', '');
  if (followups.length === 0) lines.push('- None.');
  else for (const followup of followups) lines.push(`- ${followup.scope}: ${followup.item}`);
  lines.push('');
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, lines.join('\n'), 'utf8');
  return 'artifacts/llm/reports/docs-upkeep.md';
}

export function buildChildSummaryContext(scope, completedArtifacts, flags) {
  const parentDir = scope.dir === 'root' ? '' : scope.dir;
  const children = [...completedArtifacts.entries()].filter(([dir]) => {
    if (parentDir === '') return dir !== 'root'; // root inherits everything
    return dir.startsWith(`${parentDir}/`);
  });
  if (children.length === 0) return '';
  const maxCharsPerChild = flags.quick ? 600 : 1800;
  const totalMax = flags.quick ? 6000 : 18000;
  const parts = children
    .sort(([a], [b]) => a.localeCompare(b))
    .map(
      ([dir, data]) =>
        `### Inner scope: ${dir}\nSummary: ${data.summary}\n${data.artifact.slice(0, maxCharsPerChild)}`,
    );
  return `## Inner folder summaries (deepest first)\n\n${parts.join('\n\n')}`.slice(0, totalMax);
}

export function artifactSlug(label) {
  return (
    label
      .replace(/[^a-z0-9]+/gi, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase() || 'root'
  );
}

// ─── Progress helpers ─────────────────────────────────────────────────────────
