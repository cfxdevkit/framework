import { isHelpToken } from './agent-runtime.js';
import { renderRepoResult, runRepoCommand } from './repo-check-runtime.js';

export const GATE_NAMES = [
  'lint',
  'test',
  'typecheck',
  'build',
  'format',
  'gitnexus-analyze',
] as const;

export type GateName = (typeof GATE_NAMES)[number];

export async function runGateCommand(args: readonly string[]): Promise<void> {
  const rest = [...args];
  while (rest[0] === '--') rest.shift();
  const [target = 'help', ...forwardedArgs] = rest;

  if (isHelpToken(target) || target === '--list') {
    console.log(
      `Available quality gates:\n  ${GATE_NAMES.join('\n  ')}\n\nUsage: cdk repo gate <name> [--json]`,
    );
    return;
  }

  if (!(GATE_NAMES as readonly string[]).includes(target)) {
    console.error(`Unknown gate: '${target}'. Available: ${GATE_NAMES.join(', ')}`);
    process.exitCode = 1;
    return;
  }

  const jsonOutput = forwardedArgs.includes('--json');
  const gateArgs = forwardedArgs.filter((a) => a !== '--json');
  const result = await runRepoCommand(target as GateName, gateArgs);
  console.log(await renderRepoResult(result, jsonOutput ? 'json' : 'text'));
  process.exitCode = result.exitCode;
}
