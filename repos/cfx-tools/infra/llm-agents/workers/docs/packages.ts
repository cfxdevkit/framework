/**
 * Orchestrates the docs-site package page pipeline:
 *  1. Sync package MDX stubs via docs-pipeline (deterministic)
 *  2. Discover public packages via docs-pipeline package-page discovery
 *  3. LLM enrich each content/packages/<slug>.mdx
 */
import { discoverPackagePageTargets, syncPackagePageSkeletons } from '@cfxdevkit/docs-pipeline';
import { logInfo, logStep } from '../shared/logging.ts';
import { parseDocFlags } from './flags.ts';
import { enrichPackagePage } from './package-page-enrichment.ts';

export async function runDocsPackagePages(args: string[]): Promise<void> {
  const flags = parseDocFlags(args);
  const total = 3;

  logStep(1, total, 'sync package MDX stubs via docs-pipeline');
  const syncResult = await syncPackagePageSkeletons();
  logInfo(
    `  synced ${syncResult.packageCount} package pages (${syncResult.created} created, ${syncResult.updated} updated)`,
  );

  logStep(2, total, 'discover package pages');
  const packages = await discoverPackagePageTargets({ packageName: flags.package });
  logInfo(`  found ${packages.length} packages`);

  logStep(3, total, 'LLM enrich docs-site package pages');
  let enriched = 0;
  let skipped = 0;
  for (const pkg of packages) {
    const ok = await enrichPackagePage(pkg, flags).catch((e: unknown) => {
      logInfo(`  [error] ${pkg.slug}: ${e instanceof Error ? e.message : String(e)}`);
      return false;
    });
    if (ok) enriched++;
    else skipped++;
  }
  logInfo(`\npackage-pages complete — enriched: ${enriched}, skipped: ${skipped}`);
}
