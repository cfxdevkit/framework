/**
 * Orchestrates the README.md upkeep + LLM enrichment pipeline.
 *
 * Steps:
 *  1. Run `pnpm gen:readme` (scaffold missing READMEs via arch-check)
 *  2. Discover public packages (via @cfxdevkit/docs-pipeline)
 *  3. LLM enrich each README (fill placeholders, add usage)
 */
import { type DocsPackagePageRecord, discoverDocsPagePackages } from '@cfxdevkit/docs-pipeline';
import { commandBlock } from '../completion/index.js';
import { logInfo, logStep } from '../shared/logging.js';
import { parseDocFlags } from './flags.js';
import { enrichReadmeMd } from './readme-enrichment.js';

export type PkgEntry = Pick<DocsPackagePageRecord, 'rel' | 'name' | 'skeletonHash'>;

export async function discoverPublicPackages(pkgFilter?: string): Promise<PkgEntry[]> {
  const packages = await discoverDocsPagePackages({ packageName: pkgFilter });
  return packages.map((p) => ({ rel: p.rel, name: p.name, skeletonHash: p.skeletonHash }));
}

export async function runDocsReadme(args: string[]): Promise<void> {
  const flags = parseDocFlags(args);

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
