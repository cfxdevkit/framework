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
  readPackagePageHash,
  stripPackagePageHash,
  type PackagePageTarget,
  writePackagePageHash,
} from '@cfxdevkit/docs-pipeline';
import { completeStructuredAgent } from '../completion/index.ts';
import { logInfo } from '../shared/logging.ts';

async function callPackagePageLlm(
  pkg: { name: string; rel: string },
  existingContent: string,
  readmeSnippet: string,
  flags: { quick?: boolean; model?: string },
): Promise<string | null> {
  const maxTokens = flags.quick ? 2000 : 4000;

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
      'Do NOT invent API calls not shown in the context. Return ONLY the complete improved MDX — no JSON wrapper, no explanation.',
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
  flags: { quick?: boolean; model?: string; force?: boolean },
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
  const enriched = await callPackagePageLlm(pkg, contentForLlm, readmeSnippet, flags);
  if (!enriched) {
    logInfo(`  [skip] ${pkg.name}: LLM returned no usable content`);
    return false;
  }

  const withFooter = writePackagePageHash(enriched, pkg.skeletonHash);
  await writeFile(mdxPath, withFooter, 'utf8');
  logInfo(`  [done] ${pkg.name}: MDX page enriched`);
  return true;
}
