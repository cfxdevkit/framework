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

function toMdxSafeContent(content: string): string {
  return content
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\{@link\s+([^}]+)\}/g, '`$1`')
    .replace(/`0x\$\{string\}`/g, 'HexAddress')
    .replace(/0x\$\{string\}/g, 'HexAddress')
    .replace(/```mermaid\n([\s\S]*?)```/g, (_match, diagram: string) => {
      const fixedAt = diagram.replace(/\[(@[^\]"]+)\]/g, '["$1"]');
      const escaped = fixedAt.replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
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
  const mdFiles = files.filter((file) => file.endsWith('.md') && !SKIP_FILES.has(file));
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
