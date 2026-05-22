import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { ToolingNamespaceDefinition } from './contracts.js';

const repoCommands = [
  {
    name: 'check',
    description: 'Run deterministic repo validation checks',
    usage: 'check <hotspots|docs|ci|secrets|corpus|eval> [args]',
  },
  {
    name: 'generate',
    description: 'Run deterministic repo reference document generators',
    usage: 'generate <api|readme|structure> [args]',
  },
  {
    name: 'arch-check',
    description: 'Run the full repository architecture and docs contract check',
    usage: 'arch-check [args]',
  },
  {
    name: 'review',
    description: 'Review current repository changes through the active agent workflow',
    usage: 'review',
  },
  {
    name: 'precommit',
    description: 'Run precommit quality gates before commit generation',
    usage: 'precommit [args]',
  },
  {
    name: 'commit',
    description: 'Run the hardened repository commit workflow',
    usage: 'commit [args]',
  },
] as const;

const repoCheckScriptMap = {
  hotspots: 'check:hotspots',
  docs: 'check:docs',
  ci: 'check:ci',
  secrets: 'check:secrets',
  corpus: 'check:corpus',
  eval: 'check:eval',
} as const;

const repoGenerateScriptMap = {
  api: 'gen:api',
  readme: 'gen:readme',
  structure: 'gen:structure',
} as const;

export const repoToolingNamespace = {
  name: 'repo',
  description: 'Repository validation, generation, and maintenance workflows',
  commands: repoCommands,
  run: runRepoCli,
} as const satisfies ToolingNamespaceDefinition;

async function runRepoCli(rawArgs: readonly string[]): Promise<void> {
  const args = [...rawArgs];
  while (args[0] === '--') args.shift();

  const [command = 'help', ...rest] = args;
  if (isHelpToken(command)) {
    printRepoHelp();
    return;
  }

  if (command === 'check') {
    while (rest[0] === '--') rest.shift();
    const [target = 'help', ...forwardedArgs] = rest;
    if (isHelpToken(target)) {
      printRepoHelp();
      return;
    }

    const script = repoCheckScriptMap[target as keyof typeof repoCheckScriptMap];
    if (!script) {
      throw new Error(`Unknown repo check target: ${target}`);
    }

    await runRootScript(script, forwardedArgs);
    return;
  }

  if (command === 'generate') {
    while (rest[0] === '--') rest.shift();
    const [target = 'help', ...forwardedArgs] = rest;
    if (isHelpToken(target)) {
      printRepoHelp();
      return;
    }

    const script = repoGenerateScriptMap[target as keyof typeof repoGenerateScriptMap];
    if (!script) {
      throw new Error(`Unknown repo generate target: ${target}`);
    }

    await runRootScript(script, forwardedArgs);
    return;
  }

  if (command === 'arch-check') {
    await runRootScript('arch:check', rest);
    return;
  }

  if (command === 'review') {
    await withLlmAgents((agents) => agents.runReviewAgent());
    return;
  }

  if (command === 'precommit') {
    await withLlmAgents((agents) => agents.runPrecommit(rest));
    return;
  }

  if (command === 'commit') {
    await withLlmAgents((agents) => agents.runCommit(rest));
    return;
  }

  printRepoHelp();
}

function printRepoHelp(): void {
  console.log(`cdk repo

Usage:
  cdk repo check <hotspots|docs|ci|secrets|corpus|eval> [args]
  cdk repo generate <api|readme|structure> [args]
  cdk repo arch-check [args]
  cdk repo review
  cdk repo precommit [args]
  cdk repo commit [args]

Intent:
  - deterministic repo maintenance belongs here
  - review, precommit, and commit are repo operations even when they delegate to the agent layer
  - use cdk llm for provider/model administration and generic repo-aware prompts`);
}

async function runRootScript(script: string, forwardedArgs: readonly string[]): Promise<void> {
  const repoRoot = findRepoRoot(process.cwd());
  const args = ['run', script, ...(forwardedArgs.length > 0 ? ['--', ...forwardedArgs] : [])];
  const exitCode = await spawnPnpm(args, repoRoot);
  process.exitCode = exitCode;
}

function spawnPnpm(args: readonly string[], cwd: string): Promise<number> {
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
    if (existsSync(join(current, 'pnpm-workspace.yaml')) && existsSync(join(current, 'package.json'))) {
      return current;
    }
    current = dirname(current);
  }
  throw new Error(`Unable to find repository root from ${startDir}`);
}

async function withLlmAgents<T>(
  run: (agents: typeof import('../../llm-agents/src/index.js')) => Promise<T> | T,
): Promise<T> {
  return runInRepoRoot(async () => run(await import('../../llm-agents/src/index.js')));
}

async function runInRepoRoot<T>(work: () => Promise<T> | T): Promise<T> {
  const previousCwd = process.cwd();
  const repoRoot = findRepoRoot(previousCwd);
  if (repoRoot === previousCwd) return await work();

  process.chdir(repoRoot);
  try {
    return await work();
  } finally {
    process.chdir(previousCwd);
  }
}

function isHelpToken(value: string): boolean {
  return value === 'help' || value === '--help' || value === '-h';
}