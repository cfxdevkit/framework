import { completeStructuredAgent, parseJsonObject } from '../completion/index.js';
import {
  addDeterministicTestUpkeepCoverage,
  buildFilesContext,
  fallbackTestUpkeepArtifact,
} from './baseline.js';

export async function generateTestUpkeepArtifact(pkg, baseContext, flags, childContext = '') {
  const inv = pkg.inventory;
  // Build source context: untested files first (highest value), then existing tests
  const untestedContext = await buildFilesContext(
    pkg.dir,
    inv.untestedFiles.slice(0, flags.quick ? 3 : 6),
    flags.quick ? 8000 : 18000,
  );
  const testContext = await buildFilesContext(
    pkg.dir,
    inv.testFiles.slice(0, flags.quick ? 2 : 4),
    flags.quick ? 4000 : 10000,
  );

  const inventorySummary = [
    `Package: ${pkg.pkgName} (${pkg.dir})`,
    `Source files (${inv.sourceCount}): ${inv.sourceFiles.slice(0, 20).join(', ')}${inv.sourceCount > 20 ? ', ...' : ''}`,
    `Test files (${inv.testCount}): ${inv.testFiles.slice(0, 20).join(', ')}${inv.testCount > 20 ? ', ...' : ''}`,
    `Untested files (${inv.untestedCount}): ${inv.untestedFiles.slice(0, 20).join(', ')}${inv.untestedCount > 20 ? ', ...' : ''}`,
  ].join('\n');

  const systemPrompt = [
    'You are a test coverage analyst for a TypeScript monorepo using Vitest.',
    'Return strict JSON only, with no markdown fence and no explanatory text.',
    'Schema: {"summary":"one sentence","hotspots":["path: reason"],"suggestions":[{"testFile":"src/relative/path.test.ts","description":"what it covers","contentLines":["TypeScript code line"]}],"followups":["action item"]}.',
    'hotspots: list source files or specific exported symbols that clearly lack test coverage.',
    'suggestions: propose new test files or additions to existing ones. Each contentLines array must be complete valid TypeScript using Vitest (import from vitest, no other test framework).',
    'Do not suggest tests for files that already have a test counterpart unless they are clearly incomplete.',
    flags.write
      ? 'The suggestions will be written to disk. Make contentLines a complete, runnable Vitest test file.'
      : 'Focus on identifying the highest-value missing tests.',
  ].join(' ');

  const userPrompt = [
    'Repository context:',
    baseContext,
    childContext ? `\n${childContext}` : '',
    '',
    '--- Package inventory ---',
    inventorySummary,
    '',
    '--- Test run output ---',
    pkg.testOutput?.slice(0, flags.quick ? 2000 : 5000) ?? '(not run)',
    '',
    '--- Untested source files ---',
    untestedContext || '(all source files have test counterparts)',
    '',
    '--- Existing tests (sample) ---',
    testContext || '(no test files found)',
    '',
    flags.prompt || 'Identify coverage hotspots and generate the highest-value missing test cases.',
  ]
    .filter((s) => s !== '')
    .join('\n');

  const response = await completeStructuredAgent({
    action: 'test-upkeep',
    flags,
    systemPrompt,
    userPrompt,
    maxTokens: flags.write ? (flags.quick ? 3200 : 6000) : flags.quick ? 1400 : 2800,
  });
  try {
    const result = validateTestUpkeepJson(response.content, pkg.label);
    return addDeterministicTestUpkeepCoverage(pkg, result, flags);
  } catch {
    const retryResponse = await completeStructuredAgent({
      action: 'test-upkeep',
      flags,
      systemPrompt: `${systemPrompt} The previous response was invalid. Return exactly one compact JSON object. No markdown.`,
      userPrompt: [
        'Previous invalid response excerpt:',
        response.content.slice(0, 800),
        '',
        userPrompt.slice(0, flags.quick ? 6000 : 20000),
      ].join('\n'),
      maxTokens: flags.write ? (flags.quick ? 2600 : 4800) : flags.quick ? 1200 : 2400,
    });
    try {
      const result = validateTestUpkeepJson(retryResponse.content, pkg.label);
      return addDeterministicTestUpkeepCoverage(pkg, result, flags);
    } catch {
      return fallbackTestUpkeepArtifact(pkg, flags);
    }
  }
}

export function validateTestUpkeepJson(content, pkgLabel) {
  const parsed = parseJsonObject(content);
  if (typeof parsed.summary !== 'string' || !parsed.summary.trim()) {
    throw new Error(`Invalid test-upkeep JSON for ${pkgLabel}: missing summary`);
  }
  const hotspots = Array.isArray(parsed.hotspots)
    ? parsed.hotspots.filter((h) => typeof h === 'string' && h.trim()).map((h) => h.trim())
    : [];
  const suggestions = Array.isArray(parsed.suggestions)
    ? parsed.suggestions.map((s) => normalizeTestSuggestion(s)).filter(Boolean)
    : [];
  const followups = Array.isArray(parsed.followups)
    ? parsed.followups.filter((f) => typeof f === 'string' && f.trim()).map((f) => f.trim())
    : [];
  return {
    summary: parsed.summary.trim(),
    artifact: formatTestUpkeepArtifact(hotspots, suggestions, followups, []),
    hotspots,
    suggestions,
    followups,
    documentedGaps: [],
  };
}

export function normalizeTestSuggestion(s) {
  if (!s || typeof s.testFile !== 'string' || !Array.isArray(s.contentLines)) return null;
  const testFile = s.testFile.trim().replace(/^\.?\//, '');
  if (!testFile.startsWith('src/') || testFile.includes('..')) return null;
  if (!testFile.endsWith('.test.js') && !testFile.endsWith('.spec.js')) return null;
  const content = s.contentLines
    .filter((l) => typeof l === 'string')
    .join('\n')
    .trim();
  if (!content) return null;
  return {
    testFile,
    description: typeof s.description === 'string' ? s.description.trim() : '',
    content: `${content}\n`,
  };
}

export function formatTestUpkeepArtifact(hotspots, suggestions, followups, documentedGaps = []) {
  const lines = [];
  lines.push('## Coverage Hotspots', '');
  if (hotspots.length) for (const h of hotspots) lines.push(`- ${h}`);
  else lines.push('- No major hotspots identified.');
  lines.push('', '## Suggested Tests', '');
  if (suggestions.length) {
    for (const s of suggestions) {
      lines.push(`### \`${s.testFile}\``, s.description, '');
      lines.push('```typescript', s.content.trim(), '```', '');
    }
  } else {
    lines.push('- No new test suggestions.');
  }
  lines.push('', '## Expected But Not Found', '');
  if (documentedGaps.length) for (const gap of documentedGaps) lines.push(`- ${gap}`);
  else lines.push('- None.');
  lines.push('', '## Follow-ups', '');
  if (followups.length) for (const f of followups) lines.push(`- ${f}`);
  else lines.push('- None.');
  return lines.join('\n');
}
