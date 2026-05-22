/**
 * Renders a deterministic README.md skeleton for a package.
 *
 * Sections produced:
 *   - Header (name + tagline placeholder)
 *   - Install snippet
 *   - Sub-paths table (from package.json exports)
 *   - Usage section (placeholder)
 *   - API reference link
 *   - Tier + dependency info
 */
import { createHash } from 'node:crypto';
import type { PublicPackageInfo } from './filter.js';

type TierInfo = {
  label: string; // e.g. "Tier 0 — framework"
  constraint: string;
};

const TIER_MAP: Record<string, TierInfo> = {
  'repos/cfx-core': {
    label: 'Tier 0 — framework',
    constraint: 'Must not runtime-import from any higher tier.',
  },
  'repos/cfx-keys': {
    label: 'Tier 0 — framework',
    constraint: 'Must not runtime-import from any higher tier.',
  },
  'repos/cfx-ui': {
    label: 'Tier 0 — framework',
    constraint: 'Must not runtime-import from any higher tier.',
  },
  'repos/cfx-solidity': {
    label: 'Tier 0 — framework',
    constraint: 'Must not runtime-import from any higher tier.',
  },
  'repos/cfx-tools': {
    label: 'Tier 1 — platform',
    constraint: 'May import Tier 0 framework packages.',
  },
  'repos/cfx-domain': {
    label: 'Tier 2 — domains',
    constraint: 'May import Tier 0 and Tier 1 packages.',
  },
  'projects/': { label: 'Tier 3 — project', constraint: 'Application-level, not published.' },
};

function detectTier(rel: string): TierInfo {
  for (const [prefix, info] of Object.entries(TIER_MAP)) {
    if (rel.startsWith(prefix)) return info;
  }
  return { label: 'Internal', constraint: '' };
}

function installBlock(name: string): string {
  return `## Install

\`\`\`bash
pnpm add ${name}
\`\`\``;
}

function subpathsTable(name: string, subpaths: Record<string, string>): string {
  const rows = Object.keys(subpaths)
    .filter((k) => k !== './package.json')
    .map((k) => {
      const import_ = k === '.' ? name : `${name}${k.slice(1)}`;
      return `| \`${import_}\` | — |`;
    });
  if (rows.length <= 1) return '';
  return `## Sub-paths

| Import | Contents |
|--------|---------|
${rows.join('\n')}`;
}

export function renderReadmeSkeleton(
  pkg: Pick<PublicPackageInfo, 'name' | 'description' | 'rel' | 'subpaths'>,
): string {
  const { name, description, rel, subpaths } = pkg;
  const tier = detectTier(rel);
  const lines: string[] = [];

  lines.push(`# \`${name}\``);
  lines.push('');
  if (description) {
    lines.push(`> ${description}`);
    lines.push('');
  } else {
    lines.push('> <!-- TODO: add a one-paragraph description -->');
    lines.push('');
  }

  lines.push(installBlock(name));
  lines.push('');

  const subTable = subpathsTable(name, subpaths);
  if (subTable) {
    lines.push(subTable);
    lines.push('');
  }

  lines.push('## Usage');
  lines.push('');
  lines.push('```typescript');
  lines.push(`// TODO: add a minimal usage example`);
  lines.push('```');
  lines.push('');

  lines.push('## API Reference');
  lines.push('');
  lines.push('See [API.md](./API.md) for the full public surface.');
  lines.push('');

  lines.push('## Tier');
  lines.push('');
  lines.push(`**${tier.label}** — ${tier.constraint}`);
  lines.push('');

  return lines.join('\n');
}

/** Checks whether a README has all required sections */
export type ReadmeSectionCheck = {
  hasInstall: boolean;
  hasUsage: boolean;
  hasApiLink: boolean;
  hasTier: boolean;
};

const requiredReadmeHeadings = {
  hasInstall: 'Install',
  hasUsage: 'Usage',
  hasApiLink: 'API Reference',
  hasTier: 'Tier',
} satisfies Record<keyof ReadmeSectionCheck, string>;

export function checkReadmeSections(content: string): ReadmeSectionCheck {
  return {
    hasInstall: /##\s+install/i.test(content),
    hasUsage: /##\s+usage/i.test(content),
    hasApiLink: /API\.md/i.test(content),
    hasTier: /tier\s+\d/i.test(content) || /\*\*tier/i.test(content),
  };
}

function extractSection(content: string, heading: string): string {
  const marker = `## ${heading}`;
  const start = content.indexOf(marker);
  if (start === -1) return '';

  const nextSection = content.indexOf('\n## ', start + marker.length);
  const end = nextSection === -1 ? content.length : nextSection;
  return content.slice(start, end).trimEnd();
}

export function backfillReadmeSections(
  existing: string,
  pkg: Pick<PublicPackageInfo, 'name' | 'description' | 'rel' | 'subpaths'>,
): string {
  const current = stripReadmeSkeletonHash(existing).trimEnd();
  const checks = checkReadmeSections(current);
  const skeleton = renderReadmeSkeleton(pkg);
  const missingSections = (Object.entries(checks) as [keyof ReadmeSectionCheck, boolean][])
    .filter(([, present]) => !present)
    .map(([key]) => extractSection(skeleton, requiredReadmeHeadings[key]))
    .filter((section) => section.length > 0);

  if (missingSections.length === 0) {
    return current;
  }

  return [current, ...missingSections].filter(Boolean).join('\n\n').trimEnd();
}

// ─── Skeleton hash utilities ───────────────────────────────────────────────
// Mirrors the api-hash pattern: embeds a SHA-256 of the deterministic skeleton
// so LLM enrichment can skip packages whose skeleton hasn't changed.

const README_HASH_RE = /\n<!--\s*readme-hash:\s*([a-f0-9]+)\s*-->\s*$/i;

/** Compute SHA-256 of the deterministic skeleton text for a package. */
export function computeReadmeSkeletonHash(
  pkg: Pick<PublicPackageInfo, 'name' | 'description' | 'rel' | 'subpaths'>,
): string {
  return createHash('sha256').update(renderReadmeSkeleton(pkg)).digest('hex');
}

/** Read the embedded skeleton hash from README content, or null if absent. */
export function readEmbeddedReadmeSkeletonHash(content: string): string | null {
  return content.match(README_HASH_RE)?.[1] ?? null;
}

/** Append (or replace) the skeleton hash footer at the end of README content. */
export function embedReadmeSkeletonHash(content: string, hash: string): string {
  const stripped = content.replace(README_HASH_RE, '');
  return `${stripped.trimEnd()}\n\n<!-- readme-hash: ${hash} -->\n`;
}

/** Strip the skeleton hash footer from README content. */
export function stripReadmeSkeletonHash(content: string): string {
  return content.replace(README_HASH_RE, '');
}
