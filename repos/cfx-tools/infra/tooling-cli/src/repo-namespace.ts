import { parseAgentMergeFlags } from './agent-merge.js';
import { isHelpToken, withAgentScope, withLlmAgents } from './agent-runtime.js';
import type { ToolingNamespaceDefinition } from './contracts.js';
import { findMonorepoUnit, listMonorepoUnits, parseScopeFlag } from './monorepo-units.js';
import {
  type RepoCommandTarget,
  renderRepoResult,
  runRepoCheck,
  runRepoCommand,
} from './repo-check-runtime.js';
import { runRepoGenerate } from './repo-generate.js';
import {
  listCandidateBranches,
  currentBranch as repoCurrentBranch,
  runDeterministicMerge,
} from './repo-merge.js';
import { renderRepoMergeResult } from './repo-merge-render.js';

const repoCommands = [
  { name: 'build', description: 'Run the Moon build across all packages', usage: 'build [--json]' },
  {
    name: 'run',
    description: 'Run any repo command with structured output',
    usage: 'run <target> [args] [--json]',
  },
  {
    name: 'check',
    description: 'Run deterministic repo validation checks',
    usage:
      'check <validation|hotspots|kebab-groups|unit-configs|docs|ci|secrets|corpus|eval> [--json]',
  },
  {
    name: 'merge',
    description: 'Deterministic PR merge: list open PRs, check mergeability, auto-merge clean ones',
    usage: 'merge [--base <branch>] [--dry-run] [--json] [branch...]',
  },
  {
    name: 'generate',
    description: 'Run deterministic repo reference document generators',
    usage: 'generate <all|api|readme|structure|unit-configs> [--json]',
  },
  {
    name: 'arch-check',
    description: 'Run the full repository architecture and docs contract check',
    usage: 'arch-check [--json]',
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

  if (command === 'build') {
    const jsonOutput = rest.includes('--json');
    const buildArgs = rest.filter((a) => a !== '--json');
    const result = await runRepoCommand('build', buildArgs);
    console.log(await renderRepoResult(result, jsonOutput ? 'json' : 'text'));
    process.exitCode = result.exitCode;
    return;
  }

  if (command === 'run') {
    while (rest[0] === '--') rest.shift();
    const [target, ...runRest] = rest;
    if (!target || isHelpToken(target)) {
      printRepoHelp();
      return;
    }
    const jsonOutput = runRest.includes('--json');
    const forwardedArgs = runRest.filter((a) => a !== '--json');
    const result = await runRepoCommand(target as RepoCommandTarget, forwardedArgs);
    console.log(await renderRepoResult(result, jsonOutput ? 'json' : 'text'));
    process.exitCode = result.exitCode;
    return;
  }

  if (command === 'check') {
    while (rest[0] === '--') rest.shift();
    const [target = 'help', ...forwardedArgs] = rest;
    if (isHelpToken(target)) {
      printRepoHelp();
      return;
    }
    const jsonOutput = forwardedArgs.includes('--json');
    const checkArgs = forwardedArgs.filter((a) => a !== '--json');

    const repoCheckTargets = new Set(['validation', 'hotspots', 'kebab-groups', 'unit-configs']);
    const checkCommandMap: Record<string, RepoCommandTarget> = {
      docs: 'check-docs',
      ci: 'check-ci',
      secrets: 'check-secrets',
      corpus: 'check-corpus',
      eval: 'check-eval',
    };

    if (repoCheckTargets.has(target)) {
      const result = await runRepoCheck(
        target as 'validation' | 'hotspots' | 'kebab-groups' | 'unit-configs',
        checkArgs,
      );
      console.log(await renderRepoResult(result, jsonOutput ? 'json' : 'text'));
      process.exitCode = result.exitCode;
    } else if (checkCommandMap[target]) {
      const result = await runRepoCommand(checkCommandMap[target] as RepoCommandTarget, checkArgs);
      console.log(await renderRepoResult(result, jsonOutput ? 'json' : 'text'));
      process.exitCode = result.exitCode;
    } else {
      throw new Error(`Unknown repo check target: ${target}`);
    }
    return;
  }

  if (command === 'generate') {
    await runRepoGenerate(rest, printRepoHelp);
    return;
  }

  if (command === 'arch-check') {
    const jsonOutput = rest.includes('--json');
    const archArgs = rest.filter((a) => a !== '--json');
    const result = await runRepoCommand('arch-check', archArgs);
    console.log(await renderRepoResult(result, jsonOutput ? 'json' : 'text'));
    process.exitCode = result.exitCode;
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

function printRepoHelp(): void {
  console.log(`cdk repo

Usage:
  cdk repo build [--json]
  cdk repo run <target> [args] [--json]
  cdk repo check <validation|hotspots|kebab-groups|unit-configs|docs|ci|secrets|corpus|eval> [--json]
  cdk repo generate <all|api|readme|structure|unit-configs> [--json]
  cdk repo arch-check [--json]
  cdk repo merge [--base <branch>] [--dry-run] [--json] [branch...]
  cdk repo units [list|show <preset>]
  cdk repo [--scope <preset>] review
  cdk repo [--scope <preset>] precommit [args]
  cdk repo [--scope <preset>] commit [args]

Notes:
  - all check/generate/arch-check/run/build commands accept --json for structured output
  - use repo units to discover the available session presets and their scoped agent overlays
  - use --scope <preset> when review, precommit, or commit should honor a preset-specific overlay
  - use cdk agent for direct PI sessions and provider/runtime administration`);
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
