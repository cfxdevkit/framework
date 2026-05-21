/**
 * Orchestrates the STRUCTURE.md generation pipeline:
 *  1. Discover public packages (reuses discoverPublicPackages from readme.ts)
 *  2. LLM generate/refresh STRUCTURE.md for each package whose directory tree changed
 */
import { logInfo, logStep } from '../shared/logging.ts';
import { discoverPublicPackages } from './readme.ts';
import { enrichStructureMd } from './structure-enrichment.ts';

type StructureFlags = {
  quick?: boolean;
  model?: string;
  package?: string;
  force?: boolean;
};

function parseFlags(args: string[]): StructureFlags {
  const flags: StructureFlags = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--quick') flags.quick = true;
    if (args[i] === '--force') flags.force = true;
    if (args[i] === '--model' && args[i + 1]) flags.model = args[++i];
    if (args[i] === '--package' && args[i + 1]) flags.package = args[++i];
  }
  return flags;
}

export async function runStructureUpkeep(args: string[]): Promise<void> {
  const flags = parseFlags(args);
  const total = 2;

  logStep(1, total, 'discover public packages');
  const packages = await discoverPublicPackages(flags.package);
  logInfo(`  found ${packages.length} packages`);

  logStep(2, total, 'LLM generate/refresh STRUCTURE.md for each package');
  let generated = 0;
  let skipped = 0;
  for (const pkg of packages) {
    const ok = await enrichStructureMd(pkg, flags);
    if (ok) generated++;
    else skipped++;
  }

  logInfo(`\nstructure-upkeep complete — generated: ${generated}, skipped: ${skipped}`);
}
