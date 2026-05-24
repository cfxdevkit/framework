/**
 * Orchestrates the API.md generation + LLM enrichment pipeline.
 *
 * Steps:
 *  1. Refresh deterministic API.md skeletons via docs-pipeline
 *  2. Discover API targets via docs-pipeline
 *  3. Call LLM enrichment per package
 */
import { discoverApiTargets, refreshApiSkeletons } from '@cfxdevkit/docs-pipeline';
import { logInfo, logStep } from '../shared/logging.ts';
import { enrichApiMd } from './api-enrichment.ts';
import { parseDocFlags } from './flags.ts';
import { precheckDocsApi } from './api-probe.ts';

export async function runDocsApi(args: string[]): Promise<void> {
  if (args[0] === '--') args.shift();
  const flags = parseDocFlags(args);
  const total = flags.precheck ? 4 : 3;

  logStep(1, total, 'Deterministic API skeleton generation');
  await refreshApiSkeletons();
  logInfo('  ✓ API.md skeletons up to date');

  logStep(2, total, 'Discovering packages for LLM enrichment');
  const packages = await discoverApiTargets({ packageName: flags.package });
  logInfo(`  ${packages.length} package(s) to enrich`);

  if (flags.precheck && packages[0]) {
    logStep(3, total, 'LLM precheck');
    await precheckDocsApi(packages[0], flags);
  }

  logStep(flags.precheck ? 4 : 3, total, 'LLM enrichment');
  let enriched = 0;
  let skipped = 0;
  for (const pkg of packages) {
    logInfo(`  Enriching ${pkg.rel}...`);
    const ok = await enrichApiMd(pkg.rel, flags).catch((e: unknown) => {
      logInfo(`  [error] ${pkg.rel}: ${e instanceof Error ? e.message : String(e)}`);
      return false;
    });
    if (ok) enriched++;
    else skipped++;
  }

  logInfo(`\ndocs-api — enriched: ${enriched}, skipped: ${skipped}`);
}
