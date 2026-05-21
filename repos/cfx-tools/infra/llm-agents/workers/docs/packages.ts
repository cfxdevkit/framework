/**
 * Orchestrates the docs-site package page pipeline:
 *  1. Sync package MDX stubs via docs-pipeline
 *  2. Discover public packages via docs-pipeline package-page discovery
 *  3. LLM enrich each content/packages/<slug>.mdx
 */
import { discoverPackagePageTargets, syncPackagePageSkeletons } from '@cfxdevkit/docs-pipeline';
import { logInfo, logStep } from '../shared/logging.ts';
import { enrichPackagePage } from './package-page-enrichment.ts';

type DocsPackagePagesFlags = {
  quick?: boolean;
  model?: string;
  package?: string;
  force?: boolean;
};

function parseFlags(args: string[]): DocsPackagePagesFlags {
  const flags: DocsPackagePagesFlags = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--quick') flags.quick = true;
    if (args[i] === '--force') flags.force = true;
    if (args[i] === '--model' && args[i + 1]) flags.model = args[++i];
    if (args[i] === '--package' && args[i + 1]) flags.package = args[++i];
  }
  return flags;
}

export async function runDocsPackagePages(args: string[]): Promise<void> {
  const flags = parseFlags(args);
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
    const ok = await enrichPackagePage(pkg, flags);
    if (ok) enriched++;
    else skipped++;
  }

  logInfo(`\npackage-pages complete — enriched: ${enriched}, skipped: ${skipped}`);
}
