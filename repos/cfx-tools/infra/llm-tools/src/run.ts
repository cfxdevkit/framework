import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { findLlmCommand, type LlmCommandDefinition, llmCommands } from './commands.js';
import { runPiCompatibilityMode } from './pi-agent-runtime.js';

const packageDir = join(
  findRepoRoot(dirname(fileURLToPath(import.meta.url))),
  'repos/cfx-tools/infra/llm-tools',
);

export async function runCli(rawArgs: readonly string[]): Promise<void> {
  const args = rawArgs[0] === '--' ? rawArgs.slice(1) : rawArgs;
  const [commandName = 'help', ...rest] = args;

  if (commandName === 'help' || commandName === '--help' || commandName === '-h') {
    printHelp();
    return;
  }

  const command = findLlmCommand(commandName);
  if (!command) {
    console.error(`Unknown llm-tools command: ${commandName}`);
    printHelp();
    process.exitCode = 1;
    return;
  }

  await runWorker(command, rest);
}

async function runWorker(command: LlmCommandDefinition, args: readonly string[]): Promise<void> {
  if (command.worker === 'pi') {
    await runPiRuntime(command.workerArgs, args);
    return;
  }

  const repoRoot = findRepoRoot(packageDir);
  const script = workerScript(command.worker);
  const exitCode = await spawnNode(
    ['exec', 'tsx', join(packageDir, script), ...command.workerArgs, ...args],
    repoRoot,
  );
  process.exitCode = exitCode;
}

function workerScript(worker: LlmCommandDefinition['worker']): string {
  if (worker === 'llm') return 'workers/lemonade/cli.ts';
  return 'workers/llm-agents.ts';
}

async function runPiRuntime(workerArgs: readonly string[], args: readonly string[]): Promise<void> {
  await runPiCompatibilityMode(workerArgs, args);
}

async function spawnNode(args: readonly string[], cwd: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const child = spawn('pnpm', args, {
      cwd,
      stdio: 'inherit',
      env: process.env,
    });
    child.on('error', reject);
    child.on('exit', (code, signal) => {
      if (signal) {
        resolve(1);
        return;
      }
      resolve(code ?? 1);
    });
  });
}

function findRepoRoot(startDir: string): string {
  let current = startDir;
  while (current !== dirname(current)) {
    if (existsSync(join(current, 'pnpm-workspace.yaml')) && existsSync(join(current, 'scripts'))) {
      return current;
    }
    current = dirname(current);
  }
  throw new Error(`Unable to find repository root from ${startDir}`);
}

function printHelp(): void {
  console.log(`Usage: pnpm --filter @cfxdevkit/llm-tools llm -- <command> [args]

Commands:
${llmCommands.map((command) => `  ${command.name.padEnd(14)} ${command.description}`).join('\n')}

Examples:
  pnpm run llm:models
  pnpm --filter @cfxdevkit/llm-tools llm -- interactive
  pnpm run llm:docs-upkeep -- --quick
  pnpm run llm:test-audit
  pnpm run llm:commit -- --dry-run
`);
}
