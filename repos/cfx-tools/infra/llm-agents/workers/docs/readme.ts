/**
 * Orchestrates the README.md upkeep + LLM enrichment pipeline.
 *
 * Steps:
 *  1. Run `pnpm gen:readme` (scaffold missing READMEs via arch-check)
 *  2. Discover public packages
 *  3. LLM enrich each README (fill placeholders, add usage)
 */
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { computeReadmeSkeletonHash } from '@cfxdevkit/arch-check';
import { commandBlock } from '../completion/index.ts';
import { root } from '../shared/index.ts';
import { logInfo, logStep } from '../shared/logging.ts';
import { enrichReadmeMd } from './readme-enrichment.ts';

type DocsReadmeFlags = {
  quick?: boolean;
  model?: string;
  yes?: boolean;
  package?: string;
  force?: boolean;
};

function parseDocsReadmeFlags(args: string[]): DocsReadmeFlags {
  const flags: DocsReadmeFlags = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--quick') flags.quick = true;
    if (args[i] === '--yes' || args[i] === '-y') flags.yes = true;
    if (args[i] === '--force') flags.force = true;
    if (args[i] === '--model' && args[i + 1]) {
      flags.model = args[++i];
    }
    if (args[i] === '--package' && args[i + 1]) {
      flags.package = args[++i];
    }
  }
  return flags;
}

const CONFIG_PACKAGE_NAMES = new Set([
  '@cfxdevkit/biome-config',
  '@cfxdevkit/tsconfig',
  '@cfxdevkit/moon-config',
  '@cfxdevkit/arch-rules',
]);

export type PkgEntry = { rel: string; name: string; skeletonHash: string };

export async function discoverPublicPackages(pkgFilter?: string): Promise<PkgEntry[]> {
  const results: PkgEntry[] = [];
  const repoDirs = [
    'repos/cfx-core',
    'repos/cfx-keys',
    'repos/cfx-ui',
    'repos/cfx-solidity',
    'repos/cfx-tools',
    'repos/cfx-domain',
  ];
  for (const repoDir of repoDirs) {
    for (const parent of ['packages', 'infra']) {
      const parentDir = join(root, repoDir, parent);
      let entries: string[] = [];
      try {
        entries = await readdir(parentDir);
      } catch {
        continue;
      }
      for (const entry of entries) {
        const pkgDir = join(parentDir, entry);
        const rel = `${repoDir}/${parent}/${entry}`;
        let pkgJson: {
          name?: string;
          private?: boolean;
          description?: string;
          exports?: unknown;
        } | null = null;
        try {
          pkgJson = JSON.parse(await readFile(join(pkgDir, 'package.json'), 'utf8'));
        } catch {
          continue;
        }
        if (!pkgJson?.name || pkgJson.private === true) continue;
        if (CONFIG_PACKAGE_NAMES.has(pkgJson.name)) continue;
        if (pkgJson.name.includes('docs-site')) continue;
        if (pkgFilter && pkgJson.name !== pkgFilter) continue;

        // Build subpaths map for skeleton hash computation
        const subpaths: Record<string, string> = {};
        const exportsField = pkgJson.exports;
        if (exportsField && typeof exportsField === 'object') {
          for (const [key, val] of Object.entries(exportsField)) {
            if (typeof val === 'string') subpaths[key] = val;
            else if (val && typeof val === 'object' && 'import' in val)
              subpaths[key] = (val as { import: string }).import;
          }
        }
        const skeletonHash = computeReadmeSkeletonHash({
          name: pkgJson.name,
          description: pkgJson.description ?? '',
          rel,
          subpaths,
        });
        results.push({ rel, name: pkgJson.name, skeletonHash });
      }
    }
  }
  return results;
}

export async function runDocsReadme(args: string[]): Promise<void> {
  const flags = parseDocsReadmeFlags(args);

  const total = 3;

  logStep(1, total, 'scaffold missing READMEs via gen:readme');
  const genOutput = await commandBlock('generate:readme', 'pnpm', ['run', 'gen:readme'], {
    timeoutMs: 60000,
    maxChars: 10000,
  });
  logInfo(genOutput);

  logStep(2, total, 'discover public packages');
  const packages = await discoverPublicPackages(flags.package);
  logInfo(`  found ${packages.length} packages`);

  logStep(3, total, 'LLM enrich README.md for each package');
  let enriched = 0;
  let skipped = 0;
  for (const pkg of packages) {
    const ok = await enrichReadmeMd(pkg, flags);
    if (ok) enriched++;
    else skipped++;
  }

  logInfo(`\nreadme-upkeep complete — enriched: ${enriched}, skipped: ${skipped}`);
}
