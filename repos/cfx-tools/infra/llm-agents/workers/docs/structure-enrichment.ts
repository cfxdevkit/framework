/**
 * LLM enrichment for STRUCTURE.md files.
 *
 * For each public package, builds a directory tree listing (depth 3, excluding
 * node_modules/dist/coverage/.git), hashes the listing, and:
 *  - If no STRUCTURE.md exists: skips and asks the caller to run `gen:structure` first.
 *  - If STRUCTURE.md exists with a matching `<!-- structure-hash: ... -->` footer:
 *    skips unless the file is still marked as needing enrichment.
 *  - If the footer hash differs: regenerates (new files/folders added).
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  computeStructureTreeHash,
  embedStructureMetadata,
  readEmbeddedStructureHash,
  stripStructureMetadata,
  structureNeedsEnrichment,
} from '@cfxdevkit/arch-check';
import { completeStructuredAgent } from '../completion/index.ts';
import { root } from '../shared/index.ts';
import { createLlmProgressReporter, logInfo } from '../shared/logging.ts';

// ── directory tree walker ─────────────────────────────────────────────────
const SKIP_DIRS = new Set(['node_modules', 'dist', '.git', 'coverage', '.turbo', '.moon']);

async function walkTree(dir: string, prefix = '', depth = 0): Promise<string[]> {
  if (depth > 3) return [];
  let items: string[];
  try {
    items = await readdir(dir);
  } catch {
    return [];
  }
  const lines: string[] = [];
  for (const item of items.filter((n) => !SKIP_DIRS.has(n))) {
    lines.push(`${prefix}${item}`);
    lines.push(...(await walkTree(join(dir, item), `${prefix}  `, depth + 1)));
  }
  return lines;
}

// ── LLM call ─────────────────────────────────────────────────────────────
async function callStructureLlm(
  pkg: { name: string; rel: string },
  existingContent: string,
  treeLines: string[],
  flags: { quick?: boolean; model?: string; noThinking?: boolean },
): Promise<string | null> {
  const maxTokens = flags.quick ? 1500 : 3000;

  const treeText = treeLines.slice(0, 120).join('\n');

  const response = await completeStructuredAgent({
    action: 'structure-upkeep',
    flags,
    systemPrompt: [
      'You are a technical documentation writer for a TypeScript monorepo package.',
      'Write a STRUCTURE.md file that documents the directory layout of the given package.',
      'For each significant file or directory, add a short inline comment (after the name, using — ) explaining its purpose.',
      'Use a code block for the tree. Group by section (src/, dist/, config files).',
      'Keep it concise — one line per entry. Return ONLY the complete STRUCTURE.md — no JSON, no explanation.',
    ].join(' '),
    userPrompt: [
      `Package: ${pkg.name}`,
      `Workspace path: ${pkg.rel}`,
      '',
      'CURRENT STRUCTURE.md:',
      stripStructureMetadata(existingContent).slice(0, flags.quick ? 5000 : 10000),
      '',
      'Directory tree:',
      '```',
      treeText,
      '```',
    ].join('\n'),
    maxTokens,
    onProgress: createLlmProgressReporter(pkg.name),
  });

  const raw = response.content?.trim() ?? '';
  if (!raw) return null;

  if (raw.startsWith('#') && raw.length > 50) return raw;
  const fenceMatch = raw.match(/```(?:markdown|md)?\n([\s\S]+?)```/);
  if (fenceMatch?.[1] && fenceMatch[1].length > 50) return fenceMatch[1].trim();

  return raw.length > 50 ? raw : null;
}

// ── main export ───────────────────────────────────────────────────────────
export async function enrichStructureMd(
  pkg: { name: string; rel: string },
  flags: { quick?: boolean; model?: string; force?: boolean; noThinking?: boolean },
): Promise<boolean> {
  const pkgDir = join(root, pkg.rel);
  const structurePath = join(pkgDir, 'STRUCTURE.md');

  const treeLines = await walkTree(pkgDir);
  if (treeLines.length === 0) {
    logInfo(`  [skip] ${pkg.rel}: empty directory tree`);
    return false;
  }

  const treeHash = computeStructureTreeHash(treeLines);
  let existing: string;

  try {
    existing = await readFile(structurePath, 'utf8');
  } catch {
    logInfo(`  [skip] ${pkg.rel}: no STRUCTURE.md found (run gen:structure first)`);
    return false;
  }

  // Check existing STRUCTURE.md for matching hash
  if (!flags.force) {
    const embeddedHash = readEmbeddedStructureHash(existing);
    if (embeddedHash === treeHash && !structureNeedsEnrichment(existing)) {
      logInfo(`  [skip] ${pkg.rel}: tree unchanged since last generation`);
      return false;
    }
  }

  logInfo(`  generating STRUCTURE.md: ${pkg.rel}`);
  const generated = await callStructureLlm(pkg, existing, treeLines, flags);
  if (!generated) {
    logInfo(`  [skip] ${pkg.rel}: LLM returned no usable content`);
    return false;
  }

  const withFooter = embedStructureMetadata(generated, treeHash);
  await writeFile(structurePath, withFooter, 'utf8');
  logInfo(`  [done] ${pkg.rel}/STRUCTURE.md written`);
  return true;
}
