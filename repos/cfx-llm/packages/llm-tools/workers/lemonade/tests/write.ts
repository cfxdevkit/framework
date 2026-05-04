// @ts-nocheck
import { mkdir, stat, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { artifactSlug } from '../docs/write.ts';
import { artifactsRoot, root } from '../shared/index.ts';
import { logInfo } from '../shared/logging.ts';

export async function writeTestUpkeepSuggestions(pkg, result, _flags) {
  const written = [];
  for (const suggestion of result.suggestions) {
    const destPath = join(root, pkg.dir, suggestion.testFile);
    // Safety: only write if file does not exist yet
    try {
      await stat(destPath);
      logInfo(`    ! skipped (already exists): ${suggestion.testFile}`);
      continue;
    } catch {
      /* does not exist — safe to write */
    }
    await mkdir(dirname(destPath), { recursive: true });
    await writeFile(destPath, suggestion.content, 'utf8');
    written.push(suggestion.testFile);
    logInfo(`    + wrote ${suggestion.testFile}`);
  }
  return written;
}

export async function writeTestUpkeepScopeArtifact(pkg, result) {
  const inv = pkg.inventory ?? {};
  const filePath = join(artifactsRoot, 'reports', 'test-upkeep', `${artifactSlug(pkg.label)}.md`);
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(
    filePath,
    [
      `# Test upkeep: ${pkg.label}`,
      '',
      `Generated: ${new Date().toISOString()}`,
      `Package: ${pkg.pkgName}`,
      `Source files: ${inv.sourceCount ?? 'n/a'}`,
      `Test files: ${inv.testCount ?? 'n/a'}`,
      `Untested files: ${inv.untestedCount ?? 'n/a'}`,
      '',
      result.artifact,
      '',
    ].join('\n'),
    'utf8',
  );
}

export async function writeTestUpkeepIndex(results, flags) {
  const path = join(artifactsRoot, 'reports', 'test-upkeep.md');
  const lines = [
    '# Test Upkeep',
    '',
    `Generated: ${new Date().toISOString()}`,
    `Mode: ${flags.quick ? 'quick' : 'full'}`,
    `Write mode: ${flags.write ? 'yes' : 'no (suggestions in artifacts only)'}`,
    `Test run: ${flags.skipTestRun ? 'skipped' : 'executed'}`,
    '',
    '## Package Results',
    '',
  ];
  let totalUntested = 0;
  let totalWritten = 0;
  let totalDocumentedGaps = 0;
  for (const result of results) {
    const artifact = `artifacts/llm/reports/test-upkeep/${artifactSlug(result.pkg.label)}.md`;
    const inv = result.pkg.inventory ?? {};
    totalUntested += inv.untestedCount ?? 0;
    totalWritten += result.writtenFiles?.length ?? 0;
    totalDocumentedGaps += result.documentedGaps?.length ?? 0;
    lines.push(
      `- ${result.ok ? 'ok' : 'error'} ${result.pkg.label}: ${result.ok ? result.summary : result.error}`,
      `  - Untested: ${inv.untestedCount ?? 'n/a'} of ${inv.sourceCount ?? 'n/a'} source files`,
      `  - Test status: ${result.testStatus ?? (flags.skipTestRun ? 'skipped' : 'unknown')}`,
      `  - Hotspots: ${result.hotspots?.length ?? 0} | Suggestions: ${result.suggestions?.length ?? 0} | Written: ${result.writtenFiles?.length ?? 0} | Documented gaps: ${result.documentedGaps?.length ?? 0}`,
      `  - Artifact: ${artifact}`,
    );
  }
  lines.push(
    '',
    '## Summary',
    '',
    `- Total packages analysed: ${results.length}`,
    `- Total untested source files: ${totalUntested}`,
    `- Total test files written: ${totalWritten}`,
    `- Total expected-but-not-found gaps documented: ${totalDocumentedGaps}`,
    '',
    '## Consolidated Hotspots',
    '',
  );
  const allHotspots = results.flatMap((r) =>
    (r.hotspots ?? []).map((h) => ({ pkg: r.pkg.label, h })),
  );
  if (allHotspots.length === 0) lines.push('- None identified.');
  else for (const { pkg, h } of allHotspots) lines.push(`- ${pkg}: ${h}`);
  lines.push('', '## Consolidated Follow-ups', '');
  const allFollowups = results.flatMap((r) =>
    (r.followups ?? []).map((f) => ({ pkg: r.pkg.label, f })),
  );
  if (allFollowups.length === 0) lines.push('- None.');
  else for (const { pkg, f } of allFollowups) lines.push(`- ${pkg}: ${f}`);
  lines.push('', '## Expected But Not Found', '');
  const allDocumentedGaps = results.flatMap((r) =>
    (r.documentedGaps ?? []).map((gap) => ({ pkg: r.pkg.label, gap })),
  );
  if (allDocumentedGaps.length === 0) lines.push('- None.');
  else for (const { pkg, gap } of allDocumentedGaps) lines.push(`- ${pkg}: ${gap}`);
  lines.push('');
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, lines.join('\n'), 'utf8');
  return 'artifacts/llm/reports/test-upkeep.md';
}

export function buildTestChildSummaryContext(pkg, completedArtifacts, flags) {
  // Siblings: packages in the same repo (same first 2 path components)
  const repoParts = pkg.dir.split('/').slice(0, 2).join('/');
  const siblings = [...completedArtifacts.entries()].filter(
    ([dir]) => dir !== pkg.dir && dir.startsWith(repoParts),
  );
  if (siblings.length === 0) return '';
  const maxCharsEach = flags.quick ? 500 : 1400;
  const parts = siblings
    .sort(([a], [b]) => a.localeCompare(b))
    .map(
      ([dir, data]) =>
        `### Sibling: ${dir}\nSummary: ${data.summary}\n${data.artifact.slice(0, maxCharsEach)}`,
    );
  return `## Sibling package summaries (same repo)\n\n${parts.join('\n\n')}`.slice(
    0,
    flags.quick ? 4000 : 12000,
  );
}
