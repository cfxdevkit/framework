/**
 * Orchestrates the STRUCTURE.md generation pipeline:
 *  1. Run `pnpm gen:structure` (scaffold deterministic STRUCTURE.md skeletons via arch-check)
 *  2. Discover public packages (reuses discoverPublicPackages from readme.ts)
 *  3. LLM enrich STRUCTURE.md for each package whose deterministic scaffold still needs prose
 */
import { commandBlock } from '../completion/index.ts';
import { logInfo, logStep } from '../shared/logging.ts';
import { discoverPublicPackages } from './readme.ts';
import { enrichStructureMd } from './structure-enrichment.ts';

type StructureFlags = {
  quick?: boolean;
  model?: string;
  package?: string;
  force?: boolean;
  noThinking?: boolean;
};

function parseFlags(args: string[]): StructureFlags {
  const flags: StructureFlags = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--quick') flags.quick = true;
    if (args[i] === '--no-thinking') flags.noThinking = true;
    if (args[i] === '--force') flags.force = true;
    if (args[i] === '--model' && args[i + 1]) flags.model = args[++i];
    if (args[i] === '--package' && args[i + 1]) flags.package = args[++i];
  }
  return flags;
}

export async function runStructureUpkeep(args: string[]): Promise<void> {
  const flags = parseFlags(args);
  const total = 3;

  logStep(1, total, 'scaffold deterministic STRUCTURE.md files via gen:structure');
  const genOutput = await commandBlock('generate:structure', 'pnpm', ['run', 'gen:structure'], {
    timeoutMs: 60000,
    maxChars: 10000,
  });
  logInfo(genOutput);

  logStep(2, total, 'discover public packages');
  const packages = await discoverPublicPackages(flags.package);
  logInfo(`  found ${packages.length} packages`);

  logStep(3, total, 'LLM enrich STRUCTURE.md for each package');
  let generated = 0;
  let skipped = 0;
  for (const pkg of packages) {
    const ok = await enrichStructureMd(pkg, flags);
    if (ok) generated++;
    else skipped++;
  }

  logInfo(`\nstructure-upkeep complete — generated: ${generated}, skipped: ${skipped}`);
}
