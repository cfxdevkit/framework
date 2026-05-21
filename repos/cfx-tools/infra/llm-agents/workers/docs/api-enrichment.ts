/**
 * LLM enrichment for API.md files.
 *
 * Takes a deterministic API.md skeleton (already written by generate-api)
 * and asks the local LLM to add one-line description comments to exported symbols
 * and a usage example per sub-path.
 *
 * The hash footer is preserved unchanged.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { completeStructuredAgent } from '../completion/index.ts';
import { root } from '../shared/index.ts';
import { logInfo } from '../shared/logging.ts';

type EnrichmentResult = {
  enrichedLines: string[];
};

function extractHashFooter(content: string): string {
  const match = content.match(/\n(<!-- api-hash: [a-f0-9]+ -->)\s*$/i);
  return match?.[1] ?? '';
}

async function callEnrichmentLlm(
  packageName: string,
  skeletonContent: string,
  flags: { quick?: boolean; model?: string },
): Promise<string[]> {
  const maxTokens = flags.quick ? 2000 : 4000;
  const hashFooter = extractHashFooter(skeletonContent);
  const skeletonWithoutFooter = hashFooter
    ? skeletonContent.replace(/\n<!-- api-hash: [a-f0-9]+ -->\s*$/i, '')
    : skeletonContent;

  const response = await completeStructuredAgent({
    action: 'docs-api',
    flags,
    systemPrompt: [
      'You are a TypeScript API documentation writer.',
      'You receive an API.md skeleton with type signatures and add description comments.',
      'Return strict JSON: {"enrichedLines":["line1","line2",...]}',
      'Each element is one line of the output markdown (no trailing newline per element).',
      'Do NOT change type signatures. Do NOT remove or modify the sub-paths table.',
      'Add // <one-line description> comments above each function/class/const/type declaration inside ```ts blocks.',
      'Add a "### Usage" subsection with a brief code example after each ## `subpath` heading.',
    ].join(' '),
    userPrompt: [
      `Package: ${packageName}`,
      'Task: enrich the API.md below with description comments. Return the full enriched document as enrichedLines array.',
      '',
      'CURRENT API.md:',
      skeletonWithoutFooter.slice(0, flags.quick ? 8000 : 16000),
    ].join('\n'),
    maxTokens,
  });

  try {
    const parsed = JSON.parse(response.content) as EnrichmentResult;
    if (Array.isArray(parsed.enrichedLines)) return parsed.enrichedLines;
  } catch {
    // LLM returned invalid JSON — skip enrichment
  }
  return [];
}

export async function enrichApiMd(
  rel: string,
  flags: { quick?: boolean; model?: string },
): Promise<boolean> {
  const apiMdPath = join(root, rel, 'API.md');
  let existing: string;
  try {
    existing = await readFile(apiMdPath, 'utf8');
  } catch {
    logInfo(`  [skip] ${rel}: no API.md found`);
    return false;
  }

  const hashFooter = extractHashFooter(existing);
  // Read package.json for name
  let packageName = rel;
  try {
    const pkg = JSON.parse(await readFile(join(root, rel, 'package.json'), 'utf8'));
    packageName = pkg.name ?? rel;
  } catch {
    // use rel
  }

  const enrichedLines = await callEnrichmentLlm(packageName, existing, flags);
  if (enrichedLines.length === 0) {
    logInfo(`  [skip] ${rel}: LLM returned no enrichment`);
    return false;
  }

  // Rebuild content — append original hash footer
  let enriched = enrichedLines.join('\n');
  if (hashFooter) {
    enriched = `${enriched.trimEnd()}\n\n${hashFooter}\n`;
  }
  await writeFile(apiMdPath, enriched, 'utf8');
  return true;
}
