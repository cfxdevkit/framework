/**
 * Hash utilities for API.md staleness detection.
 * Embeds a SHA-256 of all sub-path .d.ts contents as a comment footer.
 */

import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const HASH_COMMENT_RE = /<!--\s*api-hash:\s*([a-f0-9]+)\s*-->/i;

export function computeApiHash(dtsContents: string[]): string {
  const h = createHash('sha256');
  for (const c of dtsContents) h.update(c);
  return h.digest('hex');
}

export function readEmbeddedHash(apiMdContent: string): string | null {
  return apiMdContent.match(HASH_COMMENT_RE)?.[1] ?? null;
}

export function embedHash(markdown: string, hash: string): string {
  // Remove any existing footer then append new one
  const stripped = markdown.replace(/\n<!--\s*api-hash:[^>]*-->\s*$/, '');
  return `${stripped.trimEnd()}\n\n<!-- api-hash: ${hash} -->\n`;
}

export async function readApiMdHash(apiMdPath: string): Promise<string | null> {
  let content: string;
  try {
    content = await readFile(apiMdPath, 'utf8');
  } catch {
    return null;
  }
  return readEmbeddedHash(content);
}
