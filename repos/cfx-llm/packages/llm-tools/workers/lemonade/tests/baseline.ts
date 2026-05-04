// @ts-nocheck
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { root } from '../shared/index.ts';
import { unique } from '../shared/logging.ts';
import { formatTestUpkeepArtifact } from './generate.ts';

export async function addDeterministicTestUpkeepCoverage(pkg, result, flags) {
  const baseline = await generateBaselineTestSuggestions(pkg, result.suggestions, flags);
  const suggestions = [...result.suggestions, ...baseline.suggestions];
  const hotspots = unique([...result.hotspots, ...baseline.hotspots]);
  const documentedGaps = unique([...(result.documentedGaps ?? []), ...baseline.documentedGaps]);
  const followups = unique([...result.followups, ...baseline.followups]);
  const summary =
    baseline.suggestions.length > 0
      ? `${result.summary} Added ${baseline.suggestions.length} deterministic baseline test suggestion(s).`
      : result.summary;
  return {
    ...result,
    summary,
    artifact: formatTestUpkeepArtifact(hotspots, suggestions, followups, documentedGaps),
    hotspots,
    suggestions,
    followups,
    documentedGaps,
  };
}

export async function generateBaselineTestSuggestions(pkg, existingSuggestions, flags) {
  const existingTestFiles = new Set(existingSuggestions.map((suggestion) => suggestion.testFile));
  const suggestions = [];
  const hotspots = [];
  const documentedGaps = [];
  const followups = [];
  const candidates = pkg.inventory?.untestedFiles ?? [];
  const maxCandidates = flags.quick ? 4 : 10;
  for (const sourceFile of candidates.slice(0, maxCandidates)) {
    const testFile = sourceFile.replace(/\.tsx?$/, '.test.ts');
    if (existingTestFiles.has(testFile)) continue;
    let content = '';
    try {
      content = await readFile(join(root, pkg.dir, sourceFile), 'utf8');
    } catch {
      documentedGaps.push(
        `${sourceFile}: source file disappeared before baseline test generation.`,
      );
      continue;
    }
    const classification = classifyBaselineTestTarget(sourceFile, content);
    hotspots.push(`${sourceFile}: ${classification.reason}`);
    if (!classification.testable) {
      documentedGaps.push(`${sourceFile}: ${classification.reason}`);
      continue;
    }
    suggestions.push({
      testFile,
      description: classification.description,
      content: buildBaselineRuntimeTest(sourceFile, classification),
      deterministic: true,
    });
    existingTestFiles.add(testFile);
  }
  if (candidates.length > maxCandidates) {
    followups.push(
      `${candidates.length - maxCandidates} additional untested file(s) were deferred by the current run limit.`,
    );
  }
  return { suggestions, hotspots, documentedGaps, followups };
}

export function classifyBaselineTestTarget(sourceFile, content) {
  const stripped = stripCommentsForTestClassification(content);
  const hasRuntimeExport =
    /^\s*export\s+(?:async\s+)?(?:function|class|const|let|var|enum|default)\b/m.test(stripped);
  const hasRuntimeReExport = /^\s*export\s+(?:\*\s+from|\{[^}]+\}\s+from)\b/m.test(stripped);
  if (hasRuntimeExport || hasRuntimeReExport) {
    return {
      testable: true,
      reason: 'missing runtime smoke test for exported module surface.',
      description: `Baseline runtime smoke test for ${sourceFile}.`,
    };
  }
  if (/^\s*export\s+(?:type|interface)\b/m.test(stripped)) {
    return {
      testable: false,
      reason:
        'type-only module has no runtime exports to assert; needs type-level coverage or API extraction checks.',
    };
  }
  return {
    testable: false,
    reason: 'no obvious exported runtime surface; needs manual test design.',
  };
}

export function stripCommentsForTestClassification(content) {
  return content
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
    .trim();
}

export function buildBaselineRuntimeTest(sourceFile, classification) {
  const importPath = `./${sourceFile
    .split('/')
    .pop()
    .replace(/\.tsx?$/, '.js')}`;
  const subject = sourceFile.replace(/^src\//, '').replace(/\.tsx?$/, '');
  const exportAssertion = classification.reason.includes('runtime smoke')
    ? ['    expect(Object.keys(moduleUnderTest).length).toBeGreaterThan(0);']
    : [];
  return [
    "import { describe, expect, it } from 'vitest';",
    `import * as moduleUnderTest from '${importPath}';`,
    '',
    `describe('${subject}', () => {`,
    "  it('loads its public runtime surface', () => {",
    '    expect(moduleUnderTest).toBeDefined();',
    ...exportAssertion,
    '  });',
    '});',
    '',
  ].join('\n');
}

export async function fallbackTestUpkeepArtifact(pkg, flags) {
  const baseline = await generateBaselineTestSuggestions(pkg, [], flags);
  const summary =
    baseline.suggestions.length > 0
      ? `LLM test analysis was malformed for ${pkg.label}; generated ${baseline.suggestions.length} deterministic baseline test suggestion(s).`
      : `LLM test analysis was malformed for ${pkg.label}; documented coverage gaps for manual review.`;
  return {
    summary,
    artifact: formatTestUpkeepArtifact(
      baseline.hotspots,
      baseline.suggestions,
      [
        ...baseline.followups,
        `Review deterministic baseline tests for ${pkg.label}; they cover module loading, not deep behavior.`,
      ],
      baseline.documentedGaps,
    ),
    hotspots: baseline.hotspots,
    suggestions: baseline.suggestions,
    followups: [
      ...baseline.followups,
      `Review deterministic baseline tests for ${pkg.label}; they cover module loading, not deep behavior.`,
    ],
    documentedGaps: baseline.documentedGaps,
  };
}

export async function buildFilesContext(pkgDir, relPaths, maxChars) {
  const parts = [];
  for (const rel of relPaths) {
    try {
      const content = await readFile(join(root, pkgDir, rel), 'utf8');
      parts.push(`--- ${rel} ---\n${content.slice(0, 10000)}`);
    } catch {
      /* skip */
    }
  }
  return parts.join('\n\n').slice(0, maxChars);
}
