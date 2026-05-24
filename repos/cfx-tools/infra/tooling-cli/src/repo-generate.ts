import { isHelpToken } from './agent-runtime.js';
import { type RepoCommandTarget, renderRepoResult, runRepoCommand } from './repo-check-runtime.js';

export const GENERATE_ALL_TARGETS: RepoCommandTarget[] = [
  'generate-api',
  'generate-readme',
  'generate-structure',
  'generate-unit-configs',
];

const GENERATE_TARGET_MAP: Record<string, RepoCommandTarget> = {
  api: 'generate-api',
  readme: 'generate-readme',
  structure: 'generate-structure',
  'unit-configs': 'generate-unit-configs',
};

export async function runRepoGenerate(
  rawArgs: readonly string[],
  printHelp: () => void,
): Promise<void> {
  const rest = [...rawArgs];
  while (rest[0] === '--') rest.shift();
  const [target = 'help', ...forwardedArgs] = rest;
  if (isHelpToken(target)) {
    printHelp();
    return;
  }
  const jsonOutput = forwardedArgs.includes('--json');
  const generateArgs = forwardedArgs.filter((a) => a !== '--json');
  const targets = target === 'all' ? GENERATE_ALL_TARGETS : [GENERATE_TARGET_MAP[target]];
  if (!targets[0])
    throw new Error(
      `Unknown generate target: ${target}. Valid: all|api|readme|structure|unit-configs`,
    );
  for (const t of targets) {
    const result = await runRepoCommand(t as RepoCommandTarget, generateArgs);
    console.log(await renderRepoResult(result, jsonOutput ? 'json' : 'text'));
    if ((result.exitCode ?? 0) !== 0) {
      process.exitCode = result.exitCode;
      return;
    }
  }
}
