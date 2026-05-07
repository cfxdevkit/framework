import { cli as extractCli } from '@cfxdevkit/codegen-contracts';
import { getString } from '../args.js';
import type { RunOptions } from '../run.js';

export interface ContractsExtractResult {
  artifactsDir: string;
  outDir: string;
}

export async function contractsExtractFromFlags(
  flags: Record<string, string | boolean>,
  opts: RunOptions,
): Promise<number> {
  try {
    const argv: string[] = [];
    const artifacts = getString(flags, 'artifacts') ?? getString(flags, 'a');
    const out = getString(flags, 'out') ?? getString(flags, 'o');
    if (artifacts) argv.push('--artifacts', artifacts);
    if (out) argv.push('--out', out);
    await extractCli(argv);
    return 0;
  } catch (err) {
    (opts.stderr ?? process.stderr).write(
      `cfx contracts extract: ${err instanceof Error ? err.message : String(err)}\n`,
    );
    return 1;
  }
}
