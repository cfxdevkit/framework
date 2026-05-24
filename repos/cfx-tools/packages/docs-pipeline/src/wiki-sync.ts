import fs from 'node:fs/promises';
import path from 'node:path';

import { findRepoRoot, getDocsSitePaths } from './workspace.js';

const SKIP_FILES = new Set([
  'overview.md',
  'other.md',
  'meta.json',
  'module_tree.json',
  'index.html',
]);

/** Returns true for wiki files that should be excluded from the docs-site sync. */
function shouldSkipWikiFile(filename: string): boolean {
  if (SKIP_FILES.has(filename)) return true;
  // Skip "Other — <repo>" pages — low-value config/metadata pages that
  // gitnexus generates for files that don't fit semantic modules.
  if (filename.startsWith('other-') && filename.endsWith('.md')) return true;
  return false;
}

/**
 * Fix mermaid diagram syntax so special characters in node labels are quoted.
 *
 * Mermaid's parser rejects unquoted labels containing: @ / & < > ( ) { } #
 * gitnexus generates package names like `[@cfxdevkit/cdk]` and paths like
 * `[src/index.ts]` that break rendering. This post-processor quotes them.
 *
 * Rules:
 *  - `NodeId[label]`  → `NodeId["label"]` when label contains special chars
 *  - `NodeId(label)`  → `NodeId("label")` when label contains special chars
 *  - Already-quoted labels `["..."]` are left untouched
 *  - Edge labels `-->|text|` are left untouched (mermaid allows them as-is)
 */
export function fixMermaidLabels(diagram: string): string {
  // Special chars that break unquoted mermaid node labels
  const NEEDS_QUOTE = /[@/&<>(){}#]/;

  const quoteNodeLabels = (input: string, open: string, close: string): string => {
    // Match: identifier + open-bracket + unquoted content with special chars + close-bracket
    // Negative lookbehind on `"` prevents double-quoting
    const esc = (c: string) => c.replace(/[-[\]/{}()*+?.\^$|]/g, '\\$&');
    const re = new RegExp(
      `(?<=[A-Za-z0-9_\\-])${esc(open)}(?!")([^${esc(close)}"\\n]+)${esc(close)}`,
      'g',
    );
    return input.replace(re, (match, label: string) => {
      if (!NEEDS_QUOTE.test(label)) return match;
      return `${open}"${label}"${close}`;
    });
  };

  let fixed = diagram;
  fixed = quoteNodeLabels(fixed, '[', ']');
  fixed = quoteNodeLabels(fixed, '(', ')');
  return fixed;
}

function toMdxSafeContent(content: string): string {
  return content
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\{@link\s+([^}]+)\}/g, '`$1`')
    .replace(/`0x\$\{string\}`/g, 'HexAddress')
    .replace(/0x\$\{string\}/g, 'HexAddress')
    .replace(/```mermaid\n([\s\S]*?)```/g, (_match, diagram: string) => {
      const fixed = fixMermaidLabels(diagram);
      const escaped = fixed.replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
      return `<Mermaid chart={\`${escaped}\`} />`;
    });
}

export async function syncWiki(): Promise<number> {
  const repoRoot = findRepoRoot();
  const { wikiContentDir } = getDocsSitePaths(repoRoot);
  const wikiSourceDir = path.join(repoRoot, '.gitnexus/wiki');

  try {
    await fs.access(wikiSourceDir);
  } catch {
    console.log(`Wiki source not found at ${wikiSourceDir} — skipping sync.`);
    return 0;
  }

  const files = await fs.readdir(wikiSourceDir);
  const mdFiles = files.filter((file) => file.endsWith('.md') && !shouldSkipWikiFile(file));
  await fs.mkdir(wikiContentDir, { recursive: true });

  for (const file of mdFiles) {
    const sourcePath = path.join(wikiSourceDir, file);
    const slug = file.replace(/\.md$/, '');
    const destPath = path.join(wikiContentDir, `${slug}.mdx`);
    const content = toMdxSafeContent(await fs.readFile(sourcePath, 'utf8'));
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = titleMatch?.[1]?.trim() || slug;
    const needsMermaid = content.includes('<Mermaid');
    const mermaidImport = needsMermaid
      ? "import { Mermaid } from '../../components/Mermaid';\n\n"
      : '';
    const mdx = `---\ntitle: "${title.replace(/"/g, '\\"')}"\n---\n\n${mermaidImport}${content}\n`;
    await fs.writeFile(destPath, mdx, 'utf8');
    console.log(`  synced ${file} → content/wiki/${slug}.mdx`);
  }

  console.log(`\nDone — synced ${mdFiles.length} wiki pages.`);
  return mdFiles.length;
}
