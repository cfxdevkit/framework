import { createHash } from 'node:crypto';
import { compile } from '@mdx-js/mdx';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';

const HASH_RE = /\n\{\/\*\s*readme-hash:\s*([a-f0-9]+)\s*\*\/\}\s*$/i;
const SYNC_VERSION = '3';

export type PackageExports = Record<string, unknown>;

export type PackagePageInput = {
  name: string;
  description: string;
  exports: PackageExports;
  readme: string | null;
  api: string | null;
};

export function computeSkeletonHash(
  name: string,
  description: string,
  exports: PackageExports,
  readme: string | null,
  api: string | null,
): string {
  const subpaths = Object.keys(exports ?? {})
    .filter((key) => key !== './package.json')
    .sort();
  const input = `v${SYNC_VERSION}\0${name}\0${description}\0${subpaths.join('\0')}\0${readme ?? ''}\0${api ?? ''}`;
  return createHash('sha256').update(input).digest('hex');
}

export function readEmbeddedHash(content: string): string | null {
  return content.match(HASH_RE)?.[1] ?? null;
}

export function embedHash(content: string, hash: string): string {
  return `${content.replace(HASH_RE, '')}\n{/* readme-hash: ${hash} */}\n`;
}

export function stripEmbeddedHash(content: string): string {
  return content.replace(HASH_RE, '');
}

export function toSlug(name: string): string {
  return name.replace('@cfxdevkit/', '').replace(/\//g, '-');
}

export function extractDescription(readme: string | null, pkgDescription: string): string {
  if (pkgDescription) return pkgDescription;
  const blockquote = readme?.match(/^>\s+(.+)$/m)?.[1];
  if (blockquote) return blockquote.replace(/\*\*/g, '').trim();
  const firstPara = readme
    ?.split('\n\n')
    .find((part) => part && !part.startsWith('#') && !part.startsWith('>'));
  return firstPara?.trim()?.slice(0, 120) ?? '';
}

function stripH1AndLead(md: string): string {
  return md
    .replace(/^#[^\n]*\n+/, '')
    .replace(/^>\s+[^\n]*\n+/, '')
    .trimStart();
}

function removeSection(md: string, headingText: string): string {
  const lines = md.split('\n');
  const result: string[] = [];
  let skip = false;
  for (const line of lines) {
    if (/^##\s+/.test(line)) {
      skip =
        line
          .replace(/^##\s+/, '')
          .trim()
          .toLowerCase() === headingText.toLowerCase();
    }
    if (!skip) result.push(line);
  }
  return result.join('\n');
}

function toMdxSafe(md: string): string {
  return md
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\{@link\s+([^}]+)\}/g, '`$1`')
    .replace(/`0x\$\{string\}`/g, 'HexAddress')
    .replace(/0x\$\{string\}/g, 'HexAddress');
}

function prepareReadmeBody(readme: string | null): string | null {
  if (!readme?.trim()) return null;
  let body = stripH1AndLead(readme);
  body = removeSection(body, 'install');
  body = toMdxSafe(body);
  return body.trim();
}

function prepareApiBody(api: string | null): string | null {
  if (!api?.trim()) return null;
  let body = stripH1AndLead(api);
  body = removeSection(body, 'sub-paths');
  body = toMdxSafe(body);
  return body.trim();
}

function buildInstallBlock(name: string): string {
  return `<Tabs items={['pnpm', 'npm', 'yarn']}>
  <Tabs.Tab>
  \`\`\`bash
  pnpm add ${name}
  \`\`\`
  </Tabs.Tab>
  <Tabs.Tab>
  \`\`\`bash
  npm install ${name}
  \`\`\`
  </Tabs.Tab>
  <Tabs.Tab>
  \`\`\`bash
  yarn add ${name}
  \`\`\`
  </Tabs.Tab>
</Tabs>`;
}

function buildSubpathsTable(name: string, exports: PackageExports): string {
  if (!exports || typeof exports !== 'object') return '';
  const rows = Object.keys(exports)
    .filter((key) => key !== './package.json')
    .map((key) => {
      const importPath = key === '.' ? name : `${name}${key.slice(1)}`;
      return `| \`${importPath}\` | — |`;
    });
  if (rows.length <= 1) return '';
  return `## Sub-paths

| Import | Contents |
|--------|---------|
${rows.join('\n')}`;
}

export function generateMdxSkeleton({
  name,
  description,
  exports,
  readme,
  api,
}: PackagePageInput): string {
  const readmeBody = prepareReadmeBody(readme);
  const apiBody = prepareApiBody(api);
  const body = readmeBody
    ? readmeBody + (apiBody ? `\n\n## API Reference\n\n${apiBody}` : '')
    : `${buildSubpathsTable(name, exports)}\n\n## Usage\n\n\`\`\`typescript
import { } from '${name}'
// TODO: add usage example
\`\`\``;
  return `---\ntitle: "${name}"\ndescription: "${description.replace(/"/g, '\\"')}"\n---\n\nimport { Callout, Tabs } from 'nextra/components'\n\n# ${name}\n\n> ${description || 'TODO: add a description'}\n\n## Install\n\n${buildInstallBlock(name)}\n\n${body}\n`;
}

export async function isValidGeneratedMdx(content: string): Promise<boolean> {
  try {
    await compile(content, {
      remarkPlugins: [remarkGfm, remarkFrontmatter],
      jsx: true,
      outputFormat: 'function-body',
    });
    return true;
  } catch {
    return false;
  }
}
