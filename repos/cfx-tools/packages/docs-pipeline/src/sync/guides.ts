import fs from 'node:fs/promises';
import path from 'node:path';

import { findRepoRoot, getDocsSitePaths } from '../workspace.js';

/**
 * Sync static guide pages from docs/guides/ to the docs-site.
 *
 * Converts Markdown to MDX with Nextra frontmatter. Generates an index page
 * that lists all available guides with titles and descriptions.
 *
 * Outputs:
 *   - content/guides/index.mdx (navigation index)
 *   - content/guides/<slug>.mdx (per-guide pages)
 */

interface GuideEntry {
  slug: string;
  title: string;
  description: string;
}

/**
 * Extract title and description from Markdown content.
 */
function extractMetadata(content: string): { title: string; description: string } {
  const titleMatch = content.match(/^#\s+(.+)$/m);
  const title = titleMatch?.[1]?.trim() ?? 'Untitled Guide';

  // Description: first sentence or first 80 chars (non-heading, non-blockquote)
  const paragraphs = content
    .split('\n\n')
    .map((p) => p.trim())
    .filter((p) => p && !p.startsWith('#') && !p.startsWith('>'));

  let description = paragraphs[0]?.slice(0, 80).replace(/\*\*/g, '').trim() ?? '';
  // Strip URLs to keep descriptions clean
  description = description.replace(/https?:\/\/[^\s)]+/g, '');
  // Take only up to the first sentence-ending punctuation
  const sentenceEnd = description.search(/[.!?]\s/);
  if (sentenceEnd > 0 && sentenceEnd < description.length - 2) {
    description = description.slice(0, sentenceEnd + 1).trim();
  }
  // Escape characters that break YAML frontmatter (double quotes, newlines)
  description = description.replace(/"/g, '').replace(/[\n\r]/g, ' ');

  return { title, description };
}

/**
 * Convert Markdown to MDX-safe content.
 * Preserves all original content but ensures MDX compatibility.
 */
function toMdxSafe(content: string): string {
  return (
    content
      // Remove HTML comments that might conflict with MDX
      .replace(/<!--[\s\S]*?-->/g, '')
      // Convert @link patterns to backticks
      .replace(/\{@link\s+([^}]+)\}/g, '`$1`')
  );
}

/**
 * Generate frontmatter for a guide page.
 */
function buildFrontmatter(title: string, description: string): string {
  return `---\ntitle: "${title.replace(/"/g, '\\"')}"\ndescription: "${description.replace(/"/g, '\\"')}"\n---\n\n`;
}

/**
 * Generate the guides index page.
 */
function buildIndexPage(entries: GuideEntry[]): string {
  const items = entries
    .map((entry) => {
      // Truncate description for the list (max 60 chars, strip URLs)
      const shortDesc = entry.description.replace(/https?:\/\/[^\s)]+/g, '...').slice(0, 60);
      return `- [${entry.title}](/guides/${entry.slug.replace(/^\/guides\//, '')}) — ${shortDesc}`;
    })
    .join('\n');

  return `---\ntitle: "Guides"\ndescription: "How-to guides for the cfxdevkit monorepo"\n---\n\nimport { Callout } from 'nextra/components'\n\n# Guides\n\nPractical how-to guides for working with the @cfxdevkit monorepo, publishing packages, and integrating with the framework.\n\n<Callout type="info">\n  New guides should be created in \`docs/guides/\` and synced to the site with \`pnpm sync:guides\`.\n</Callout>\n\n## Available Guides\n\n${items}\n`;
}

export async function syncGuides(): Promise<number> {
  const repoRoot = findRepoRoot();
  const { contentDir } = getDocsSitePaths(repoRoot);
  const guidesContentDir = path.join(contentDir, 'guides');
  const guidesSourceDir = path.join(repoRoot, 'docs', 'guides');

  console.log('sync-guides: discovering guide files...');

  // Ensure source directory exists
  try {
    await fs.access(guidesSourceDir);
  } catch {
    console.log(`  guides source not found at ${guidesSourceDir} — skipping sync.`);
    return 0;
  }

  // Read all markdown files
  const files = await fs.readdir(guidesSourceDir);
  const mdFiles = files.filter((f) => f.endsWith('.md') && f !== 'README.md');

  if (mdFiles.length === 0) {
    console.log('  no guide files found — skipping');
    return 0;
  }

  // Create output directory
  await fs.mkdir(guidesContentDir, { recursive: true });

  // Process each guide
  const entries: GuideEntry[] = [];

  for (const file of mdFiles) {
    const sourcePath = path.join(guidesSourceDir, file);
    const slug = file.replace(/\.md$/, '');
    const destPath = path.join(guidesContentDir, `${slug}.mdx`);

    const content = await fs.readFile(sourcePath, 'utf8');
    const { title, description } = extractMetadata(content);
    const safeContent = toMdxSafe(content);
    const mdx = buildFrontmatter(title, description) + safeContent;

    await fs.writeFile(destPath, mdx, 'utf8');
    entries.push({ slug: `/guides/${slug}`, title, description });
    console.log(`  synced ${file} → content/guides/${slug}.mdx`);
  }

  // Generate index page
  const indexMdx = buildIndexPage(entries);
  await fs.writeFile(path.join(guidesContentDir, 'index.mdx'), indexMdx, 'utf8');
  console.log(`  generated content/guides/index.mdx (${entries.length} guides)`);

  // Generate _meta.js for Nextra sub-page discovery
  const metaEntries = entries
    .map((entry) => {
      const slug = entry.slug.replace(/^\/guides\//, '');
      return `  '${slug}': '${entry.title}',`;
    })
    .join('\n');
  const metaContent = `// biome-ignore lint: Nextra requires default export for meta files\nexport default {\n${metaEntries}\n};\n`;
  await fs.writeFile(path.join(guidesContentDir, '_meta.js'), metaContent, 'utf8');
  console.log(`  generated content/guides/_meta.js (${entries.length} entries)`);

  console.log(`\nDone — synced ${entries.length} guide pages.`);
  return entries.length;
}
