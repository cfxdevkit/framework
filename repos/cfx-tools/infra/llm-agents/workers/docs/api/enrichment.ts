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
import { completeStructuredAgent } from '../../completion/index.ts';
import { root } from '../../shared/index.ts';
import { createLlmProgressReporter, logInfo } from '../../shared/logging.ts';

type EnrichmentResult = {
  enrichedLines: string[];
};

type DocsApiEnrichmentFlags = {
  quick?: boolean;
  model?: string;
  noThinking?: boolean;
};

function extractHashFooter(content: string): string {
  const match = content.match(/\n(<!-- api-hash: [a-f0-9]+ -->)\s*$/i);
  return match?.[1] ?? '';
}

function stripHashFooter(content: string): string {
  return content.replace(/\n<!-- api-hash: [a-f0-9]+ -->\s*$/i, '').trimEnd();
}

function parseEnrichedLinesJson(candidate: string): string[] {
  try {
    const parsed = JSON.parse(candidate) as EnrichmentResult;
    if (Array.isArray(parsed.enrichedLines)) {
      return parsed.enrichedLines.filter((line): line is string => typeof line === 'string');
    }
  } catch {
    // ignore invalid JSON candidate
  }
  return [];
}

export function resolveApiEnrichmentMaxTokens(
  skeletonContent: string,
  flags: DocsApiEnrichmentFlags,
): number {
  const maxInputChars = flags.quick ? 8000 : 16000;
  const promptChars = Math.min(stripHashFooter(skeletonContent).length, maxInputChars);
  const approximatePromptTokens = Math.ceil(promptChars / 4);
  const estimatedOutputTokens = Math.ceil(approximatePromptTokens * 1.5);

  if (flags.quick) {
    return Math.min(16000, Math.max(4800, estimatedOutputTokens + 3000));
  }

  return Math.min(64000, Math.max(24000, estimatedOutputTokens + 20000));
}

export function parseApiEnrichmentResponse(rawResponse: string): string[] {
  const raw = rawResponse.trim();
  if (!raw) return [];

  const jsonCandidates = [raw];
  const fencedJson = raw.match(/```(?:json)?\n([\s\S]+?)```/i)?.[1]?.trim();
  if (fencedJson) jsonCandidates.push(fencedJson);

  const objectStart = raw.indexOf('{');
  const objectEnd = raw.lastIndexOf('}');
  if (objectStart !== -1 && objectEnd > objectStart) {
    jsonCandidates.push(raw.slice(objectStart, objectEnd + 1));
  }

  for (const candidate of jsonCandidates) {
    const lines = parseEnrichedLinesJson(candidate);
    if (lines.length > 0) return lines;
  }

  if (raw.startsWith('#') && raw.length > 50) {
    return stripHashFooter(raw).split('\n');
  }

  const fencedMarkdown = raw.match(/```(?:markdown|md)?\n([\s\S]+?)```/i)?.[1]?.trim();
  if (fencedMarkdown?.startsWith('#') && fencedMarkdown.length > 50) {
    return stripHashFooter(fencedMarkdown).split('\n');
  }

  return [];
}

async function callEnrichmentLlm(
  packageName: string,
  skeletonContent: string,
  flags: DocsApiEnrichmentFlags,
): Promise<string[]> {
  const hashFooter = extractHashFooter(skeletonContent);
  const skeletonWithoutFooter = hashFooter
    ? skeletonContent.replace(/\n<!-- api-hash: [a-f0-9]+ -->\s*$/i, '')
    : skeletonContent;
  const maxTokens = resolveApiEnrichmentMaxTokens(skeletonWithoutFooter, flags);
  const promptBody = skeletonWithoutFooter.slice(0, flags.quick ? 8000 : 16000);

  const response = await completeStructuredAgent({
    action: 'docs-api',
    flags,
    systemPrompt: [
      'You are a TypeScript API documentation writer.',
      'You receive an API.md skeleton with type signatures and add description comments.',
      'Return ONLY the complete enriched API.md markdown with no explanation, JSON, or planning.',
      'Start with the original markdown heading and emit the final document immediately.',
      'Do NOT change type signatures. Do NOT remove or modify the sub-paths table.',
      'Add // <one-line description> comments above each function/class/const/type declaration inside ```ts blocks.',
      'Add a "### Usage" subsection with a brief code example after each ## `subpath` heading.',
    ].join(' '),
    userPrompt: [
      `Package: ${packageName}`,
      'Task: enrich the API.md below with description comments. Return the full enriched document as markdown.',
      '',
      'CURRENT API.md:',
      promptBody,
    ].join('\n'),
    maxTokens,
    onProgress: createLlmProgressReporter(packageName),
  });

  return parseApiEnrichmentResponse(response.content ?? '');
}

export async function enrichApiMd(rel: string, flags: DocsApiEnrichmentFlags): Promise<boolean> {
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
  logInfo(`  [done] ${rel}/API.md enriched`);
  return true;
}
