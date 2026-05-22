/**
 * LLM enrichment for README.md files.
 *
 * Reads the existing README.md (or scaffold skeleton), calls the LLM to
 * fill in meaningful prose for placeholder sections, and writes the result.
 * Does NOT modify the Install section or Sub-paths table — only prose sections.
 *
 * Hash check (mirrors api-hash): the `<!-- readme-hash: <sha256> -->` footer
 * encodes the SHA-256 of the *deterministic skeleton* for the package (based
 * on its name, description, exports, and tier).  `gen:readme` embeds this
 * footer when creating a skeleton; enrichment preserves it.  On the next run,
 * if the current skeleton hash matches the footer, the skeleton hasn't changed
 * (same exports / tier / description) → skip the LLM call entirely.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  embedReadmeSkeletonHash,
  readEmbeddedReadmeSkeletonHash,
  stripReadmeSkeletonHash,
} from '@cfxdevkit/arch-check';
import { completeStructuredAgent } from '../completion/index.ts';
import { root } from '../shared/index.ts';
import { createLlmProgressReporter, logInfo } from '../shared/logging.ts';

type ReadmeEnrichmentResult = {
  readme: string;
};

async function callReadmeLlm(
  pkg: { name: string; rel: string },
  existingContent: string,
  apiMdSnippet: string,
  flags: { quick?: boolean; model?: string; noThinking?: boolean },
): Promise<string | null> {
  const maxTokens = flags.quick ? 2000 : 4000;

  const response = await completeStructuredAgent({
    action: 'readme-upkeep',
    flags,
    systemPrompt: [
      'You are a technical documentation writer for a TypeScript SDK.',
      'Improve the README.md for a package by filling in placeholder sections.',
      'Keep existing content that is already good. Fill in TODOs with real, concise content.',
      'Return ONLY the complete improved README.md content — no JSON wrapper, no explanation.',
      'Do NOT invent API calls that are not in the API reference. Only use what you can see.',
      'Keep the Install section and Sub-paths table exactly as-is.',
      'Use TypeScript code blocks. Keep it concise — this is a reference README, not a tutorial.',
    ].join(' '),
    userPrompt: [
      `Package: ${pkg.name}`,
      `Workspace path: ${pkg.rel}`,
      '',
      'CURRENT README.md (fill in the placeholders):',
      existingContent.slice(0, flags.quick ? 6000 : 12000),
      '',
      apiMdSnippet ? `API REFERENCE EXCERPT:\n${apiMdSnippet.slice(0, 4000)}` : '',
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

  // Try JSON first ({"readme": "..."})
  if (raw.startsWith('{')) {
    try {
      const parsed = JSON.parse(raw) as ReadmeEnrichmentResult;
      if (typeof parsed.readme === 'string' && parsed.readme.length > 100) {
        return parsed.readme;
      }
    } catch {
      // not valid JSON — fall through to direct markdown check
    }
  }

  // Accept direct markdown output (LLM skipped the JSON wrapper)
  if (raw.startsWith('#') && raw.length > 100) {
    return raw;
  }

  // Extract markdown if LLM wrapped it in a code fence
  const fenceMatch = raw.match(/```(?:markdown|md)?\n([\s\S]+?)```/);
  if (fenceMatch?.[1] && fenceMatch[1].length > 100) {
    return fenceMatch[1].trim();
  }

  logInfo(`  [debug] ${pkg.rel}: unexpected LLM response (first 200 chars): ${raw.slice(0, 200)}`);
  return null;
}

export async function enrichReadmeMd(
  pkg: { name: string; rel: string; skeletonHash: string },
  flags: { quick?: boolean; model?: string; force?: boolean },
): Promise<boolean> {
  const readmePath = join(root, pkg.rel, 'README.md');
  let existing: string;
  try {
    existing = await readFile(readmePath, 'utf8');
  } catch {
    logInfo(`  [skip] ${pkg.rel}: no README.md found (run gen:readme first)`);
    return false;
  }

  // Hash check: skip if the deterministic skeleton hasn't changed since last enrichment.
  // The footer `<!-- readme-hash: <hash> -->` encodes the skeleton hash; if it matches
  // the current package skeleton hash, there is nothing new to enrich.
  if (!flags.force) {
    const embeddedHash = readEmbeddedReadmeSkeletonHash(existing);
    if (embeddedHash === pkg.skeletonHash) {
      logInfo(`  [skip] ${pkg.rel}: skeleton unchanged since last enrichment`);
      return false;
    }
  }

  // Strip footer before sending content to LLM
  const contentForLlm = stripReadmeSkeletonHash(existing);

  // Load API.md snippet for context
  let apiSnippet = '';
  try {
    const apiContent = await readFile(join(root, pkg.rel, 'API.md'), 'utf8');
    // Take the first ~80 lines as context
    apiSnippet = apiContent.split('\n').slice(0, 80).join('\n');
  } catch {
    // API.md is optional
  }

  logInfo(`  enriching README: ${pkg.rel}`);
  const enriched = await callReadmeLlm(pkg, contentForLlm, apiSnippet, flags);
  if (!enriched) {
    logInfo(`  [skip] ${pkg.rel}: LLM returned no usable content`);
    return false;
  }

  // Preserve the skeleton hash footer — same semantics as api-hash:
  // the hash tracks the skeleton (inputs), not the enriched prose.
  const withFooter = embedReadmeSkeletonHash(enriched, pkg.skeletonHash);
  await writeFile(readmePath, withFooter, 'utf8');
  logInfo(`  [done] ${pkg.rel}/README.md enriched`);
  return true;
}
