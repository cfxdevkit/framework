import fs from 'node:fs/promises';
import path from 'node:path';

import { findRepoRoot, getDocsSitePaths } from '../workspace.js';

/**
 * Parse a changeset .md file and extract version + entries.
 *
 * Changeset files use frontmatter with a `version` field and a body with
 * change descriptions. We read all .changeset/*.md files and group by version.
 */
interface ChangesetEntry {
  version: string;
  package: string;
  description: string;
}

function parseChangesetFile(filePath: string): Promise<ChangesetEntry[]> {
  return fs.readFile(filePath, 'utf8').then((content) => parseChangesetContent(content));
}

function parseChangesetContent(content: string): ChangesetEntry[] {
  const result: ChangesetEntry[] = [];

  // Parse YAML frontmatter
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!fmMatch) return result; // No frontmatter, not a changeset

  const fm = fmMatch[1];
  const body = fmMatch[2];

  // Detect if this is a "version" block (from npx changeset version) or a "package" block
  const versionMatch = fm.match(/version:\s*(\d+\.\d+\.\d+)/);
  if (versionMatch) {
    // Version block: entries are listed as "- @pkg: description"
    const entries = body.split(/\n(?=-\s)/).filter((line) => line.trim());
    for (const line of entries) {
      const pkgMatch = line.match(/-\s+(@[^\s]+)\s*:?\s*(.*)/);
      if (pkgMatch) {
        const pkg = pkgMatch[1];
        let desc = pkgMatch[2]?.trim() ?? '';
        if (!desc) {
          // Check continuation lines
          const lines = body.split('\n');
          const idx = lines.indexOf(line);
          if (idx + 1 < lines.length) {
            desc = lines
              .slice(idx + 1)
              .filter((l) => l.startsWith('  ') || l.startsWith('\t'))
              .map((l) => l.trim())
              .join(' ')
              .trim();
          }
        }
        if (desc) {
          result.push({ version: versionMatch[1], package: pkg, description: desc });
        }
      }
    }
    return result;
  }

  // Package block: frontmatter has "@pkg": bumplevel, body has the description
  // Format:
  // ---
  // "@cfxdevkit/cdk": patch
  // ---
  // Description text here.
  // Extract package names: matches @scope/name patterns (with optional surrounding quotes)
  const pkgNames = fm.match(/@cfxdevkit\/[a-z0-9-]+/g);
  if (pkgNames && pkgNames.length > 0) {
    // Body text is the changelog description
    const desc = body.trim();
    if (desc) {
      for (const pkg of pkgNames) {
        result.push({ version: 'latest', package: pkg, description: desc });
      }
    }
  }

  return result;
}

/**
 * Generate a changelog page from changeset entries.
 *
 * Groups entries by version, newest first. Each version shows its entries
 * as bullet points with package names and change descriptions.
 * Links to npmjs.com for provenance verification.
 */
function renderChangelog(entries: ChangesetEntry[]): string {
  // Group by version
  const byVersion = new Map<string, ChangesetEntry[]>();
  for (const entry of entries) {
    if (!byVersion.has(entry.version)) {
      byVersion.set(entry.version, []);
    }
    byVersion.get(entry.version)!.push(entry);
  }

  // Sort versions: numeric versions descending, "latest" first
  const sortedVersions = [...byVersion.keys()].sort((a, b) => {
    if (a === 'latest') return -1;
    if (b === 'latest') return 1;
    const [aMajor, aMinor, aPatch] = a.split('.').map(Number);
    const [bMajor, bMinor, bPatch] = b.split('.').map(Number);
    return (
      bMajor - aMajor ||
      bMinor - aMinor ||
      bPatch - aPatch
    );
  });

  const blocks: string[] = [];

  for (const version of sortedVersions) {
    const entries = byVersion.get(version)!;
    const isLatest = version === 'latest';

    const title = isLatest ? 'Upcoming Changes' : `Version ${version}`;
    const dateLine = isLatest
      ? '**Status:** Pending release'
      : `**Published:** See [npm](https://www.npmjs.com/package/@cfxdevkit/cdk/v/${version})`;

    const items = entries
      .map((entry) => {
        const pkg = entry.package;
        const pkgName = pkg.replace('@cfxdevkit/', '');
        const npmUrl = isLatest
          ? `https://www.npmjs.com/package/${pkg}`
          : `https://www.npmjs.com/package/${pkg}/v/${version}`;
        return `- **[${pkgName}](${npmUrl})** ${entry.description}`;
      })
      .join('\n');

    blocks.push(`## ${title}\n\n${dateLine}\n\n${items}`);
  }

  return `---\ntitle: "Releases"\ndescription: "Changelog for @cfxdevkit packages"\n---\n\nimport { Callout } from 'nextra/components'\n\n# Releases\n\nChangelog for all \`@cfxdevkit\` packages. Each package has provenance attached via OIDC when published to npm.\n\n<Callout type="info">\n  This page is auto-generated from \`.changeset/\` entries. Run \`pnpm changeset\` to add a new entry.\n</Callout>\n\n${blocks.join('\n\n---\n\n')}\n`;
}

/**
 * Read all changeset .md files and return entries.
 */
async function readAllChangesetFiles(changesetDir: string): Promise<ChangesetEntry[]> {
  const entries: ChangesetEntry[] = [];

  try {
    const files = await fs.readdir(changesetDir);
    const mdFiles = files.filter((f) => f.endsWith('.md') && f !== 'README.md');

    const promises = mdFiles.map(async (file) => {
      const filePath = path.join(changesetDir, file);
      return parseChangesetFile(filePath);
    });

    const results = await Promise.all(promises);
    for (const fileEntries of results) {
      entries.push(...fileEntries);
    }
  } catch {
    // changeset dir may not exist or be empty
  }

  return entries;
}

/**
 * Sync releases page from changeset entries.
 *
 * Outputs: content/releases.mdx
 */
export async function syncReleases(): Promise<number> {
  const repoRoot = findRepoRoot();
  const { contentDir } = getDocsSitePaths(repoRoot);
  const dest = path.join(contentDir, 'releases.mdx');
  const changesetDir = path.join(repoRoot, '.changeset');

  console.log('sync-releases: reading changeset entries...');

  const entries = await readAllChangesetFiles(changesetDir);
  console.log(`  found ${entries.length} entries`);

  if (entries.length === 0) {
    console.log('  no entries found — skipping (run `pnpm changeset` to create one)');
    return 0;
  }

  const mdx = renderChangelog(entries);
  await fs.writeFile(dest, mdx, 'utf8');
  console.log(`sync-releases: wrote content/releases.mdx (${entries.length} entries)`);

  return entries.length;
}
