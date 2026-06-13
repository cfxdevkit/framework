/**
 * LLM enrichment for content/packages/*.mdx pages in the docs-site.
 *
 * Reads the existing MDX skeleton (written by docs-pipeline), calls the
 * LLM to fill in sub-path descriptions, code examples, and usage prose, then
 * writes the result. Uses the docs-pipeline skeleton hash footer so package-page
 * enrichment tracks the deterministic page skeleton rather than README hashes.
 */
import { readFile, writeFile } from 'node:fs/promises';
import {
  getPackagePagePath,
  type PackagePageTarget,
  readPackagePageHash,
  stripPackagePageHash,
  writePackagePageHash,
} from '@cfxdevkit/docs-pipeline';
import { completeStructuredAgent } from '../../completion/index.ts';
import { createLlmProgressReporter, logInfo } from '../../shared/logging.ts';

type PackagePageFlags = {
  quick?: boolean;
  model?: string;
  noThinking?: boolean;
};

type HeadingSection = {
  start: number;
  end: number;
  text: string;
};

type SubpathsRow = {
  importPath: string;
  description: string;
};

type SubpathsTable = {
  header: string;
  separator: string;
  rows: SubpathsRow[];
};

export function resolvePackagePageMaxTokens(
  existingContent: string,
  readmeSnippet: string,
  flags: PackagePageFlags,
): number {
  const pageChars = Math.min(existingContent.length, flags.quick ? 6000 : 12000);
  const readmeChars = Math.min(readmeSnippet.length, 3000);
  const approximatePromptTokens = Math.ceil((pageChars + readmeChars) / 4);
  const estimatedOutputTokens = Math.ceil(approximatePromptTokens * 1.35);

  if (flags.quick) {
    return Math.min(7000, Math.max(2200, estimatedOutputTokens + 1200));
  }

  return Math.min(24000, Math.max(8000, estimatedOutputTokens + 7000));
}

function normalizePackagePageContent(content: string): string {
  return content.replace(/\r\n/g, '\n').trim();
}

function extractHeadingSection(content: string, heading: string): HeadingSection | null {
  const marker = `## ${heading}\n`;
  const start = content.indexOf(marker);
  if (start === -1) return null;

  const bodyStart = start + marker.length;
  const nextHeadingOffset = content.slice(bodyStart).search(/\n## [^\n]+\n/);
  const end = nextHeadingOffset === -1 ? content.length : bodyStart + nextHeadingOffset;
  return {
    start,
    end,
    text: content.slice(start, end).trimEnd(),
  };
}

function parseSubpathsTable(section: string): SubpathsTable | null {
  const lines = section
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const tableLines = lines.filter((line) => line.startsWith('|'));
  if (tableLines.length < 3) return null;
  if (!/^\|[-\s|]+\|$/.test(tableLines[1])) return null;

  const rows: SubpathsRow[] = [];
  for (const line of tableLines.slice(2)) {
    const match = line.match(/^\|\s*`([^`]+)`\s*\|\s*(.*?)\s*\|$/);
    if (!match) return null;
    rows.push({ importPath: match[1], description: match[2].trim() });
  }
  return {
    header: tableLines[0],
    separator: tableLines[1],
    rows,
  };
}

function isPlaceholderDescription(value: string): boolean {
  return /^[-—–_\s]*$/.test(value.trim());
}

function rebuildSubpathsSection(
  existingTable: SubpathsTable,
  candidateTable: SubpathsTable,
): string | null {
  if (existingTable.rows.length !== candidateTable.rows.length) return null;

  const rebuiltRows: string[] = [];
  for (const [index, existingRow] of existingTable.rows.entries()) {
    const candidateRow = candidateTable.rows[index];
    if (candidateRow.importPath !== existingRow.importPath) return null;
    if (!candidateRow.description || isPlaceholderDescription(candidateRow.description))
      return null;
    rebuiltRows.push(`| \`${existingRow.importPath}\` | ${candidateRow.description} |`);
  }

  return ['## Sub-paths', '', existingTable.header, existingTable.separator, ...rebuiltRows].join(
    '\n',
  );
}

function isValidPackagePageTail(candidateTail: string, existingTail: string): boolean {
  const normalizedCandidate = candidateTail.trim();
  if (!normalizedCandidate) return false;
  if (normalizedCandidate.startsWith('---') || normalizedCandidate.startsWith('## Install')) {
    return false;
  }

  const minimumLength = Math.min(160, Math.max(32, Math.floor(existingTail.trim().length * 0.35)));
  if (normalizedCandidate.length < minimumLength) return false;
  if (existingTail.includes('```') && !normalizedCandidate.includes('```')) return false;
  return true;
}

export function validatePackagePageEnrichment(
  existingContent: string,
  candidateContent: string,
): string | null {
  const existing = normalizePackagePageContent(stripPackagePageHash(existingContent));
  const candidate = normalizePackagePageContent(candidateContent);

  const install = extractHeadingSection(existing, 'Install');
  if (!install) return null;
  const candidateInstall = extractHeadingSection(candidate, 'Install');
  if (!candidateInstall) return null;

  const existingPrefix = existing.slice(0, install.start).trimEnd();
  const candidatePrefix = candidate.slice(0, candidateInstall.start).trimEnd();
  if (candidatePrefix !== existingPrefix) return null;
  if (candidateInstall.text.trimEnd() !== install.text.trimEnd()) return null;

  const existingSubpaths = extractHeadingSection(existing, 'Sub-paths');
  const candidateSubpaths = extractHeadingSection(candidate, 'Sub-paths');

  if (Boolean(existingSubpaths) !== Boolean(candidateSubpaths)) return null;

  if (existingSubpaths && candidateSubpaths) {
    const existingTable = parseSubpathsTable(existingSubpaths.text);
    const candidateTable = parseSubpathsTable(candidateSubpaths.text);
    if (!existingTable || !candidateTable) return null;

    const rebuiltSubpaths = rebuildSubpathsSection(existingTable, candidateTable);
    if (!rebuiltSubpaths) return null;

    const existingTail = existing.slice(existingSubpaths.end).trim();
    const candidateTail = candidate.slice(candidateSubpaths.end).trim();
    if (!isValidPackagePageTail(candidateTail, existingTail)) return null;

    return [existingPrefix, install.text.trimEnd(), rebuiltSubpaths, candidateTail]
      .join('\n\n')
      .trimEnd();
  }

  const existingTail = existing.slice(install.end).trim();
  const candidateTail = candidate.slice(candidateInstall.end).trim();
  if (!isValidPackagePageTail(candidateTail, existingTail)) return null;
  return [existingPrefix, install.text.trimEnd(), candidateTail].join('\n\n').trimEnd();
}

async function callPackagePageLlm(
  pkg: { name: string; rel: string },
  existingContent: string,
  readmeSnippet: string,
  flags: PackagePageFlags,
): Promise<string | null> {
  const maxTokens = resolvePackagePageMaxTokens(existingContent, readmeSnippet, flags);

  const response = await completeStructuredAgent({
    action: 'package-pages',
    flags,
    systemPrompt: [
      'You are a technical documentation writer for a TypeScript SDK docs site built with Nextra (Next.js).',
      'Improve the MDX package page by filling in the sub-path table "—" descriptions with short real descriptions and adding TypeScript usage examples.',
      'Keep the YAML frontmatter, install Tabs block, and sub-paths table structure exactly as-is.',
      'Replace each "—" in the sub-paths table with a real short description (5–10 words max).',
      'Add concise TypeScript code examples after the sub-paths section.',
      'Use <Callout> from nextra/components for important architectural notes if relevant.',
      'Do NOT invent API calls not shown in the context.',
      'Return ONLY the complete improved MDX with no JSON wrapper, commentary, or planning.',
      'Start with the existing frontmatter or heading and emit the final document immediately.',
    ].join(' '),
    userPrompt: [
      `Package: ${pkg.name}`,
      `Workspace path: ${pkg.rel}`,
      '',
      'CURRENT MDX PAGE (improve the placeholder sections):',
      existingContent.slice(0, flags.quick ? 6000 : 12000),
      '',
      readmeSnippet ? `README.md EXCERPT:\n${readmeSnippet.slice(0, 3000)}` : '',
    ]
      .filter(Boolean)
      .join('\n'),
    maxTokens,
    onProgress: createLlmProgressReporter(pkg.name),
  });

  const raw = response.content?.trim() ?? '';
  if (!raw) {
    logInfo(`  [debug] ${pkg.rel}: LLM returned empty response`);
    return null;
  }

  // Accept direct MDX (starts with frontmatter, heading, or import)
  if (
    (raw.startsWith('---') || raw.startsWith('#') || raw.startsWith('import')) &&
    raw.length > 100
  ) {
    return raw;
  }

  // Extract if LLM wrapped output in a code fence
  const fenceMatch = raw.match(/```(?:mdx|markdown|md)?\n([\s\S]+?)```/);
  if (fenceMatch?.[1] && fenceMatch[1].length > 100) {
    return fenceMatch[1].trim();
  }

  logInfo(`  [debug] ${pkg.name}: unexpected LLM response (first 200): ${raw.slice(0, 200)}`);
  return null;
}

export async function enrichPackagePage(
  pkg: PackagePageTarget,
  flags: { quick?: boolean; model?: string; force?: boolean; noThinking?: boolean },
): Promise<boolean> {
  const mdxPath = getPackagePagePath(pkg);

  let existing: string;
  try {
    existing = await readFile(mdxPath, 'utf8');
  } catch {
    logInfo(`  [skip] ${pkg.name}: no MDX page found (run sync:packages first)`);
    return false;
  }

  if (!flags.force) {
    const embeddedHash = readPackagePageHash(existing);
    if (embeddedHash === pkg.skeletonHash) {
      logInfo(`  [skip] ${pkg.name}: skeleton unchanged since last enrichment`);
      return false;
    }
  }

  const contentForLlm = stripPackagePageHash(existing);

  const readmeSnippet = pkg.readme?.split('\n').slice(0, 60).join('\n') ?? '';

  logInfo(`  enriching page: ${pkg.name}`);
  const candidate = await callPackagePageLlm(pkg, contentForLlm, readmeSnippet, flags);
  if (!candidate) {
    logInfo(`  [skip] ${pkg.name}: LLM returned no usable content`);
    return false;
  }

  const enriched = validatePackagePageEnrichment(contentForLlm, candidate);
  if (!enriched) {
    logInfo(`  [skip] ${pkg.name}: validation rejected the MDX rewrite`);
    return false;
  }

  const withFooter = writePackagePageHash(enriched, pkg.skeletonHash);
  await writeFile(mdxPath, withFooter, 'utf8');
  logInfo(`  [done] ${pkg.name}: ${mdxPath} enriched`);
  return true;
}
