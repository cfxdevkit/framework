import { writeContractModules } from '@cfxdevkit/codegen-contracts';
import { getString } from '../args.js';
import type { RunOptions } from '../run.js';

export interface ContractsExtractReport {
  artifactsDir: string;
  outDir: string;
  count: number;
}

export interface RunContractsExtractOptions {
  artifacts?: string;
  out?: string;
}

export async function runContractsExtract(
  opts: RunContractsExtractOptions = {},
): Promise<ContractsExtractReport> {
  const artifactsDir = opts.artifacts ?? 'artifacts';
  const outDir = opts.out ?? 'src/generated/contracts';
  const artifacts = await writeContractModules({ artifactsDir, outDir });
  return { artifactsDir, outDir, count: artifacts.length };
}

export async function contractsExtractFromFlags(
  flags: Record<string, string | boolean>,
  opts: RunOptions,
): Promise<number> {
  try {
    const artifacts = getString(flags, 'artifacts') ?? getString(flags, 'a');
    const out = getString(flags, 'out') ?? getString(flags, 'o');
    const extractOpts: RunContractsExtractOptions = {};
    if (artifacts) extractOpts.artifacts = artifacts;
    if (out) extractOpts.out = out;
    const report = await runContractsExtract(extractOpts);
    (opts.stdout ?? process.stdout).write(
      `Extracted ${report.count} contract artifact(s) from ${report.artifactsDir}\n`,
    );
    return 0;
  } catch (err) {
    (opts.stderr ?? process.stderr).write(
      `cfx contracts extract: ${err instanceof Error ? err.message : String(err)}\n`,
    );
    return 1;
  }
}
