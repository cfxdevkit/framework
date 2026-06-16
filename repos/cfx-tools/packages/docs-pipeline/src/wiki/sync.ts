import fs from 'node:fs/promises';
import path from 'node:path';

import { findRepoRoot, getDocsSitePaths } from '../workspace.js';

const SKIP_FILES = new Set(['other.md', 'meta.json', 'module_tree.json', 'index.html']);

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
  // Normalize pipe chars inside node labels BEFORE quoting:
  // B[Client|Server] → B[Client / Server] (| is CSS class syntax in mermaid, not display)
  diagram = diagram.replace(/(?<=[A-Za-z0-9_-])\[(?!")([^\]"\n]*)\]/g, (match, label: string) =>
    label.includes('|') ? `[${label.replace(/\|/g, ' / ')}]` : match,
  );

  const NEEDS_QUOTE = /[@/&<>(){}#]/;

  const quoteNodeLabels = (input: string, open: string, close: string): string => {
    // Match: identifier + open-bracket + unquoted content with special chars + close-bracket
    // Negative lookbehind on `"` prevents double-quoting
    const esc = (c: string) => c.replace(/[-[\]/{}()*+?.^$|]/g, '\\$&');
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

/**
 * Maximum lines in a mermaid diagram before we simplify it.
 * Diagrams over this size render too small and are hard to read even with zoom.
 */
const MERMAID_MAX_LINES = 30;

/**
 * Simplify an oversized mermaid diagram by keeping only the top-level connections
 * (entries with depth 1 from the root node). Returns the simplified diagram or
 * the original if it already fits within MERMAID_MAX_LINES.
 */
export function simplifyMermaidDiagram(diagram: string): string {
  const lines = diagram.trim().split('\n');
  const contentLines = lines.filter((l) => l.trim() && !l.trim().startsWith('%%'));
  if (contentLines.length <= MERMAID_MAX_LINES) return diagram;

  // Keep header line (graph TD / flowchart LR / etc.) + subgraph declarations + top-level edges only
  const header = lines[0]?.trim() ?? 'graph TD';
  const topEdges: string[] = [];
  const seen = new Set<string>();
  for (const line of lines.slice(1)) {
    const t = line.trim();
    if (!t || t.startsWith('%%') || t.startsWith('style') || t.startsWith('classDef')) continue;
    if (t.startsWith('subgraph') || t === 'end') {
      topEdges.push(line);
      continue;
    }
    // Only keep lines where the source node appears in the first 3 top-level edges
    // (heuristic: prune deep sub-trees)
    const match = t.match(/^([A-Za-z0-9_]+)\s*[-=]/);
    if (match?.[1]) {
      const src = match[1];
      if (!seen.has(src)) {
        seen.add(src);
        topEdges.push(line);
      } else if (seen.size <= MERMAID_MAX_LINES / 2) {
        topEdges.push(line);
      }
    } else {
      topEdges.push(line);
    }
    if (
      topEdges.filter((l) => l.trim() && !l.trim().startsWith('subgraph') && l.trim() !== 'end')
        .length >=
      MERMAID_MAX_LINES - 1
    )
      break;
  }
  return [
    header,
    ...topEdges,
    `    %% (simplified — original had ${contentLines.length} lines)`,
  ].join('\n');
}

/**
 * Post-process wiki content for readability.
 *
 * Rules:
 *  - Keep the H1 heading
 *  - Condense the first 200 words into a single overview paragraph
 *  - Remove "Integration with Codebase" sections entirely
 *  - Remove sentences containing "The module contains no executable code"
 *  - Keep "Configuration Files" and "Package Layout" sections
 *  - Maximum ~15 content lines (excluding frontmatter, mermaid, code blocks)
 */
export function condenseWikiContent(content: string): string {
  let lines = content.split('\n');

  // Step 1: Remove "Integration with Codebase" sections (including subsections)
  const result: string[] = [];
  let skipIntegration = false;
  let integrationHeadingLevel = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    // Check if this is a heading that starts the Integration section
    if (/^##+\s+/.test(line)) {
      const headingText = line
        .replace(/^#+\s+/, '')
        .trim()
        .toLowerCase();
      if (headingText === 'integration with codebase') {
        skipIntegration = true;
        const match = line.match(/^(#+)/);
        integrationHeadingLevel = match?.[1]?.length ?? 2;
        continue;
      }
      // If we're skipping and hit a heading at same or lower level, stop skipping
      if (skipIntegration) {
        const currentLevel = line.match(/^(#+)/);
        const currentLevelNum = currentLevel?.[1]?.length ?? 2;
        if (currentLevelNum <= integrationHeadingLevel) {
          skipIntegration = false;
        }
      }
    }

    if (!skipIntegration) {
      // Step 2: Remove sentences with boilerplate disclaimers
      if (/The module contains no executable code/i.test(line)) {
        continue;
      }
      result.push(line);
    }
  }

  lines = result;

  // Step 3: Extract and condense the first content paragraph
  // Find the first non-heading, non-empty, non-codeblock content
  let firstParaStart = -1;
  let firstParaEnd = -1;
  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]?.trim();
    if (line === undefined || line.startsWith('```')) {
      if (line !== undefined && line.startsWith('```')) {
        inCodeBlock = !inCodeBlock;
      }
      continue;
    }
    if (inCodeBlock) continue;
    if (line.startsWith('#')) continue;
    if (line === '') continue;
    if (line.startsWith('- ') || line.startsWith('|')) continue; // list/table items

    firstParaStart = i;
    // Find end of paragraph
    for (let j = i + 1; j < lines.length; j++) {
      const nextLine = lines[j]?.trim();
      if (nextLine === '' || nextLine?.startsWith('#') || nextLine?.startsWith('```')) {
        firstParaEnd = j;
        break;
      }
      if (j === lines.length - 1) firstParaEnd = j + 1;
    }
    break;
  }

  if (firstParaStart >= 0 && firstParaEnd > firstParaStart) {
    // Extract first paragraph text (max 200 words)
    const paraLines = lines.slice(firstParaStart, firstParaEnd).join(' ');
    const words = paraLines.split(/\s+/);
    if (words.length > 200) {
      const condensed = words.slice(0, 200).join(' ') + '...';
      // Replace the paragraph with condensed version
      lines = [...lines.slice(0, firstParaStart), condensed, ...lines.slice(firstParaEnd)];
    }
  }

  // Step 4: Remove trailing "---" dividers that separate boilerplate
  while (lines.length > 0) {
    const last = lines[lines.length - 1];
    if (last?.trim() === '---') {
      lines.pop();
    } else {
      break;
    }
  }
  while (lines.length > 0) {
    const first = lines[0];
    if (first?.trim() === '---') {
      lines.shift();
    } else {
      break;
    }
  }

  return lines.join('\n');
}

function toMdxSafeContent(content: string): string {
  return content
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\{@link\s+([^}]+)\}/g, '`$1`')
    .replace(/`0x\$\{string\}`/g, 'HexAddress')
    .replace(/0x\$\{string\}/g, 'HexAddress')
    .replace(/```mermaid\n([\s\S]*?)```/g, (_match, diagram: string) => {
      const simplified = simplifyMermaidDiagram(diagram);
      const fixed = fixMermaidLabels(simplified);
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

  // Remove stale .mdx files whose source .md no longer exists in the wiki output
  const incomingSlugs = new Set(mdFiles.map((f) => f.replace(/\.md$/, '')));
  try {
    const existingMdx = (await fs.readdir(wikiContentDir)).filter((f) => f.endsWith('.mdx'));
    for (const mdx of existingMdx) {
      const slug = mdx.replace(/\.mdx$/, '');
      if (!incomingSlugs.has(slug)) {
        await fs.unlink(path.join(wikiContentDir, mdx));
        console.log(`  removed stale ${mdx}`);
      }
    }
  } catch {
    // wikiContentDir may not exist yet — that's fine
  }

  for (const file of mdFiles) {
    const sourcePath = path.join(wikiSourceDir, file);
    const slug = file.replace(/\.md$/, '');
    const destPath = path.join(wikiContentDir, `${slug}.mdx`);
    let content = toMdxSafeContent(await fs.readFile(sourcePath, 'utf8'));

    // Apply wiki quality post-processing
    content = condenseWikiContent(content);

    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = titleMatch?.[1]?.trim() || slug;
    // Mermaid is registered globally in mdx-components.tsx, no import needed
    const mdx = `---\ntitle: "${title.replace(/"/g, '\\"')}"\n---\n\n${content}\n`;
    await fs.writeFile(destPath, mdx, 'utf8');
    console.log(`  synced ${file} → content/wiki/${slug}.mdx`);
  }

  console.log(`\nDone — synced ${mdFiles.length} wiki pages.`);
  return mdFiles.length;
}
