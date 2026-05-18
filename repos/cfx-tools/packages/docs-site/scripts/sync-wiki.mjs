#!/usr/bin/env node
/**
 * Syncs .gitnexus/wiki/*.md files into content/wiki/*.mdx
 * Adds MDX frontmatter and preserves mermaid fences.
 *
 * Run: node scripts/sync-wiki.mjs
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');
const WIKI_SRC = path.join(ROOT, '.gitnexus/wiki');
const WIKI_DEST = path.join(__dirname, '../content/wiki');

const SKIP = ['overview.md', 'other.md', 'meta.json', 'module_tree.json', 'index.html'];

function toMdxSafeContent(content) {
  return content
    .replace(/`0x\$\{string\}`/g, 'HexAddress')
    .replace(/0x\$\{string\}/g, 'HexAddress');
}

async function main() {
  // Skip gracefully if the wiki source directory hasn't been generated yet
  try {
    await fs.access(WIKI_SRC);
  } catch {
    console.log(`Wiki source not found at ${WIKI_SRC} — skipping sync.`);
    return;
  }

  const files = await fs.readdir(WIKI_SRC);
  const mdFiles = files.filter((f) => f.endsWith('.md') && !SKIP.includes(f));

  await fs.mkdir(WIKI_DEST, { recursive: true });

  for (const file of mdFiles) {
    const src = path.join(WIKI_SRC, file);
    const slug = file.replace(/\.md$/, '');
    const dest = path.join(WIKI_DEST, `${slug}.mdx`);

    const content = toMdxSafeContent(await fs.readFile(src, 'utf-8'));

    // Extract title from first # heading
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1].trim() : slug;

    // Build MDX with frontmatter
    const mdx = `---\ntitle: "${title.replace(/"/g, '\\"')}"\n---\n\n${content}\n`;

    await fs.writeFile(dest, mdx, 'utf-8');
    console.log(`  synced ${file} → content/wiki/${slug}.mdx`);
  }

  console.log(`\nDone — synced ${mdFiles.length} wiki pages.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
