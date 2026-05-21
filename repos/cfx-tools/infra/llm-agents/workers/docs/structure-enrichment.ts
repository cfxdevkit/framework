/**
 * LLM enrichment for STRUCTURE.md files.
 *
 * For each public package, builds a directory tree listing (depth 3, excluding
 * node_modules/dist/coverage/.git), hashes the listing, and:
 *  - If no STRUCTURE.md exists: generates one from scratch via LLM.
 *  - If STRUCTURE.md exists with a matching `<!-- structure-hash: ... -->` footer:
 *    skips (tree unchanged since last generation).
 *  - If the footer hash differs: regenerates (new files/folders added).
 */
import { createHash } from 'node:crypto';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { completeStructuredAgent } from '../completion/index.ts';
import { root } from '../shared/index.ts';
import { logInfo } from '../shared/logging.ts';

// ── structure-hash footer ─────────────────────────────────────────────────
const STRUCTURE_HASH_RE = /\n<!--\s*structure-hash:\s*([a-f0-9]+)\s*-->\s*$/i;

function computeTreeHash(entries: string[]): string {
  return createHash('sha256')
    .update([...entries].sort().join('\n'))
    .digest('hex');
}

function readEmbeddedTreeHash(content: string): string | null {
  return content.match(STRUCTURE_HASH_RE)?.[1] ?? null;
}

function embedTreeHash(content: string, hash: string): string {
  return content.replace(STRUCTURE_HASH_RE, '') + `\n<!-- structure-hash: ${hash} -->\n`;
}

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
  treeLines: string[],
  flags: { quick?: boolean; model?: string },
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
      'Directory tree:',
      '```',
      treeText,
      '```',
    ].join('\n'),
    maxTokens,
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
  flags: { quick?: boolean; model?: string; force?: boolean },
): Promise<boolean> {
  const pkgDir = join(root, pkg.rel);
  const structurePath = join(pkgDir, 'STRUCTURE.md');

  const treeLines = await walkTree(pkgDir);
  if (treeLines.length === 0) {
    logInfo(`  [skip] ${pkg.rel}: empty directory tree`);
    return false;
  }

  const treeHash = computeTreeHash(treeLines);

  // Check existing STRUCTURE.md for matching hash
  if (!flags.force) {
    try {
      const existing = await readFile(structurePath, 'utf8');
      const embeddedHash = readEmbeddedTreeHash(existing);
      if (embeddedHash === treeHash) {
        logInfo(`  [skip] ${pkg.rel}: tree unchanged since last generation`);
        return false;
      }
    } catch {
      // file doesn't exist yet — proceed
    }
  }

  logInfo(`  generating STRUCTURE.md: ${pkg.rel}`);
  const generated = await callStructureLlm(pkg, treeLines, flags);
  if (!generated) {
    logInfo(`  [skip] ${pkg.rel}: LLM returned no usable content`);
    return false;
  }

  const withFooter = embedTreeHash(generated, treeHash);
  await writeFile(structurePath, withFooter, 'utf8');
  logInfo(`  [done] ${pkg.rel}/STRUCTURE.md written`);
  return true;
}
