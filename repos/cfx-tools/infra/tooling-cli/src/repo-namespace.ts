import { spawn } from 'node:child_process';
import { parseAgentMergeFlags } from './agent-merge.js';
import { isHelpToken, withAgentScope, withLlmAgents } from './agent-runtime.js';
import type { ToolingNamespaceDefinition } from './contracts.js';
import { findMonorepoUnit, listMonorepoUnits, parseScopeFlag } from './monorepo-units.js';
import {
  listCandidateBranches,
  renderRepoMergeResult,
  currentBranch as repoCurrentBranch,
  runDeterministicMerge,
} from './repo-merge.js';
import { findRepoRoot } from './workspace-paths.js';

const repoCommands = [
  {
    name: 'check',
    description: 'Run deterministic repo validation checks',
    usage: 'check <hotspots|kebab-groups|unit-configs|docs|ci|secrets|corpus|eval> [args]',
  },
  {
    name: 'merge',
    description: 'Deterministic PR merge: list open PRs, check mergeability, auto-merge clean ones',
    usage: 'merge [--base <branch>] [--dry-run] [--json] [branch...]',
  },
  {
    name: 'generate',
    description: 'Run deterministic repo reference document generators',
    usage: 'generate <api|readme|structure|unit-configs> [args]',
  },
  {
    name: 'arch-check',
    description: 'Run the full repository architecture and docs contract check',
    usage: 'arch-check [args]',
  },
  {
    name: 'units',
    description: 'List or inspect session presets and their agent-config overlays',
    usage: 'units [list|show <preset>]',
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
  'kebab-groups': 'check:kebab-groups',
  'unit-configs': 'check:unit-configs',
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
  'unit-configs': 'gen:unit-configs',
} as const;

export const repoToolingNamespace = {
  name: 'repo',
  description: 'Repository validation, generation, and maintenance workflows',
  commands: repoCommands,
  run: runRepoCli,
} as const satisfies ToolingNamespaceDefinition;

async function runRepoCli(rawArgs: readonly string[]): Promise<void> {
  const parsed = parseScopeFlag(rawArgs);
  const args = [...parsed.args];
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

  if (command === 'units') {
    const [subcommand = 'list', unitName] = rest;
    if (subcommand === 'list') {
      printMonorepoUnits();
      return;
    }
    if (subcommand === 'show') {
      if (!unitName) throw new Error('Usage: cdk repo units show <unit>');
      printMonorepoUnit(unitName);
      return;
    }
    throw new Error(`Unknown repo units subcommand: ${subcommand}`);
  }

  if (command === 'merge') {
    await runRepoMerge(rest);
    return;
  }

  if (command === 'review') {
    await withAgentScope(parsed.scope, async () =>
      withLlmAgents((agents) => agents.runReviewAgent()),
    );
    return;
  }

  if (command === 'precommit') {
    await withAgentScope(parsed.scope, async () =>
      withLlmAgents((agents) => agents.runPrecommit(rest)),
    );
    return;
  }

  if (command === 'commit') {
    await withAgentScope(parsed.scope, async () =>
      withLlmAgents((agents) => agents.runCommit(rest)),
    );
    return;
  }

  printRepoHelp();
}

async function runRepoMerge(rawArgs: readonly string[]): Promise<void> {
  const args = [...rawArgs];
  while (args[0] === '--') args.shift();
  if (isHelpToken(args[0] ?? 'help')) {
    printRepoHelp();
    return;
  }

  const jsonOutput = args.includes('--json');
  const flags = parseAgentMergeFlags(args.filter((a) => a !== '--json'));
  const baseBranch = flags.base ?? (await repoCurrentBranch());
  const branchNames =
    flags.branches.length > 0 ? flags.branches : await listCandidateBranches(baseBranch, []);

  const result = await runDeterministicMerge(flags, branchNames);
  if (jsonOutput) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(renderRepoMergeResult(result));
  }
  process.exitCode = result.exitCode;
}

function printRepoHelp(): void {
  console.log(`cdk repo

Usage:
  cdk repo check <hotspots|kebab-groups|unit-configs|docs|ci|secrets|corpus|eval> [args]
  cdk repo merge [--base <branch>] [--dry-run] [--json] [branch...]
  cdk repo generate <api|readme|structure|unit-configs> [args]
  cdk repo units [list|show <preset>]
  cdk repo arch-check [args]
  cdk repo [--scope <preset>] review
  cdk repo [--scope <preset>] precommit [args]
  cdk repo [--scope <preset>] commit [args]

Notes:
  - use repo units to discover the available session presets and their scoped agent overlays
  - use --scope <preset> when review, precommit, or commit should honor a preset-specific overlay
  - use cdk agent for direct PI sessions and provider/runtime administration`);
}

function printMonorepoUnits(): void {
  const units = listMonorepoUnits();
  const lines = units.map(
    (unit) =>
      `  - ${unit.name.padEnd(14)} ${unit.description} | mode ${unit.defaultMode} | aliases ${unit.aliases.join(', ')} | ${unit.relativeConfigPath}`,
  );
  console.log(`cdk repo units

Registered session presets:
${lines.join('\n')}`);
}

function printMonorepoUnit(name: string): void {
  const unit = findMonorepoUnit(name);
  if (!unit) throw new Error(`Unknown agent scope preset: ${name}`);
  console.log(`cdk repo units show ${unit.name}

Root:
  - path: ${unit.relativeRootPath}
  - description: ${unit.description}
  - aliases: ${unit.aliases.join(', ')}

Agent overlay:
  - config: ${unit.relativeConfigPath}
  - default mode: ${unit.defaultMode}
  - focus: ${unit.focus}
  - session effect: ${unit.sessionEffect}`);
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
