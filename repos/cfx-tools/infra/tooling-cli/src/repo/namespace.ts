import type { RepoCheckTarget } from '@cfxdevkit/cdk-repo-check';
import { defaultRenderer, runRepoCheck } from '@cfxdevkit/cdk-repo-check';
import type { ToolingCommandDefinition, ToolingNamespaceDefinition } from '../contracts.js';

// ─── check command ────────────────────────────────────────────────────────────

async function runCheckHandler(args: readonly string[]): Promise<void> {
  const hasHelp = args.some((a) => a === '--help' || a === '-h' || a === 'help');
  if (hasHelp) {
    process.stdout.write(
      'Usage: repo check [target] [--fail-on-hard] [--quick]\n' +
        '\n' +
        'Targets: validation (default), hotspots, kebab-groups, unit-configs\n' +
        '\n' +
        'Options:\n' +
        '  --fail-on-hard  Exit with code 1 on hard errors\n' +
        '  --quick         Run only fast checks\n',
    );
    return;
  }

  const [target = 'validation', ...rest] = args;
  // Filter out --quick (handled locally, not by cdk-repo-check)
  const filteredArgs = rest.filter((a) => a !== '--quick');
  const result = await runRepoCheck(target as RepoCheckTarget, filteredArgs);
  const text = defaultRenderer.renderText(result);
  process.stdout.write(`${text}\n`);

  if (result.status === 'error') {
    process.exitCode = 1;
  }
}

const checkCommand: ToolingCommandDefinition = {
  name: 'check',
  description: 'Run repository validation',
  usage: '[target] [--fail-on-hard] [...]',
};

// ─── precommit command ────────────────────────────────────────────────────────

async function runPrecommitHandler(args: readonly string[]): Promise<void> {
  const { runPrecommitWorkflow } = await import('@cfxdevkit/llm-agents');
  const result = await runPrecommitWorkflow(args);

  if (result.status === 'blocked') {
    process.exitCode = 1;
  }
}

const precommitCommand: ToolingCommandDefinition = {
  name: 'precommit',
  description: 'Run precommit validation sequence',
  usage: '[--force] [--skip-checks] [--with-tests] [--with-build]',
};

// ─── status command ───────────────────────────────────────────────────────────

async function runStatusHandler(): Promise<void> {
  const { listModels } = await import('@cfxdevkit/llm-agents');

  // Show provider/model context (listModels logs provider + models to console)
  await listModels();
}

const statusCommand: ToolingCommandDefinition = {
  name: 'status',
  description: 'Show repository context and available workflows',
};

// ─── actions command ──────────────────────────────────────────────────────────

async function runActionsHandler(args: readonly string[]): Promise<void> {
  const { listRepoActions } = await import('@cfxdevkit/llm-agents');

  const actions = listRepoActions();
  const modeArg = args.find((a) => a === '--mode' || a === '-m');
  const mode = modeArg ? args[args.indexOf(modeArg) + 1] : undefined;

  const filtered = mode ? actions.filter(([, a]) => a.mode === mode) : actions;

  if (filtered.length === 0) {
    process.stdout.write(`No actions${mode ? ` in mode: ${mode}` : ''} found.\n`);
    return;
  }

  process.stdout.write('Repository Actions\n');
  process.stdout.write('==================\n\n');
  for (const [name, action] of filtered) {
    const modeLabel = `[${action.mode}]`;
    process.stdout.write(`  ${name.padEnd(20)} ${modeLabel.padEnd(12)} ${action.title}\n`);
  }
}

const actionsCommand: ToolingCommandDefinition = {
  name: 'actions',
  description: 'List available repo actions',
  usage: '[--mode <deterministic|exploratory>]',
};

// ─── review command ───────────────────────────────────────────────────────────

async function runReviewHandler(args: readonly string[]): Promise<void> {
  const { runReviewAgent } = await import('@cfxdevkit/llm-agents');
  await runReviewAgent({ silent: args.length === 0 });
}

const reviewCommand: ToolingCommandDefinition = {
  name: 'review',
  description: 'Run repository review agent',
};

// ─── docs commands ────────────────────────────────────────────────────────────

async function runDocsGenerateHandler(args: readonly string[]): Promise<void> {
  const { runDocsApi, runDocsPackagePages, runDocsReadme, runStructureUpkeep } = await import(
    '@cfxdevkit/llm-agents'
  );

  const [target = 'all'] = args;

  if (target === 'api') {
    await runDocsApi([]);
  } else if (target === 'readme') {
    await runDocsReadme([]);
  } else if (target === 'structure') {
    await runStructureUpkeep([]);
  } else if (target === 'packages') {
    await runDocsPackagePages([]);
  } else {
    // Run all in order
    await runDocsApi([]);
    await runDocsReadme([]);
    await runStructureUpkeep([]);
    await runDocsPackagePages([]);
  }
}

const docsGenerateCommand: ToolingCommandDefinition = {
  name: 'generate',
  description: 'Run deterministic doc generation (skeleton only, no LLM)',
  usage: '[all|api|readme|structure|packages]',
};

async function runDocsValidateHandler(args: readonly string[]): Promise<void> {
  const { runRepoCommand, defaultRenderer } = await import('@cfxdevkit/cdk-repo-check');
  const result = await runRepoCommand('check-docs', args);
  const text = defaultRenderer.renderText(result);
  process.stdout.write(`${text}\n`);
  if (result.status === 'error') {
    process.exitCode = 1;
  }
}

const docsValidateCommand: ToolingCommandDefinition = {
  name: 'validate',
  description: 'Validate docs build, wiki sync, image, and deploy flow',
  usage: '[content|packages|wiki|all] [args]',
};

async function runDocsHandler(args: readonly string[]): Promise<void> {
  const [sub = 'help', ...rest] = args;

  if (sub === 'help' || sub === '--help' || sub === '-h') {
    process.stdout.write('Usage: repo docs <command> [args]\n\n');
    process.stdout.write('Commands:\n');
    process.stdout.write(
      `  ${docsGenerateCommand.name.padEnd(20)} ${docsGenerateCommand.description}\n`,
    );
    if (docsGenerateCommand.usage) {
      process.stdout.write(`  Usage: ${docsGenerateCommand.usage}\n`);
    }
    process.stdout.write(
      `  ${docsValidateCommand.name.padEnd(20)} ${docsValidateCommand.description}\n`,
    );
    if (docsValidateCommand.usage) {
      process.stdout.write(`  Usage: ${docsValidateCommand.usage}\n`);
    }
    return;
  }

  if (sub === 'generate') {
    await runDocsGenerateHandler(rest);
  } else if (sub === 'validate') {
    await runDocsValidateHandler(rest);
  } else {
    process.stderr.write(`Unknown docs command: ${sub}\n`);
    process.exitCode = 1;
  }
}

const docsCommand: ToolingCommandDefinition = {
  name: 'docs',
  description: 'Documentation operations',
  usage: '<generate|validate> [args]',
};

// ─── merge command ────────────────────────────────────────────────────────────

async function runMergeHandler(args: readonly string[]): Promise<void> {
  const { runPrecommitWorkflow } = await import('@cfxdevkit/llm-agents');
  await runPrecommitWorkflow(['--force', ...args]);
}

const mergeCommand: ToolingCommandDefinition = {
  name: 'merge',
  description: 'Merge validation (run precommit with --force)',
  usage: '[--dry-run] [--base <branch>] [branch...]',
};

// ─── Namespace definition ─────────────────────────────────────────────────────

const commands: readonly ToolingCommandDefinition[] = [
  checkCommand,
  precommitCommand,
  statusCommand,
  actionsCommand,
  reviewCommand,
  docsCommand,
  mergeCommand,
];

async function runNamespace(args: readonly string[]): Promise<void> {
  const [command = 'help', ...rest] = args;

  if (command === 'help' || command === '--help' || command === '-h') {
    const namespaceBlock = commands
      .map((c) => `  ${c.name.padEnd(12)} ${c.description}`)
      .join('\n');
    process.stdout.write('Usage:\n  repo <command> [args]\n\n');
    process.stdout.write('Commands:\n');
    process.stdout.write(namespaceBlock);
    process.stdout.write('\n');
    return;
  }

  if (command === 'check') {
    await runCheckHandler(rest);
  } else if (command === 'precommit') {
    await runPrecommitHandler(rest);
  } else if (command === 'status') {
    await runStatusHandler();
  } else if (command === 'actions') {
    await runActionsHandler(rest);
  } else if (command === 'review') {
    await runReviewHandler(rest);
  } else if (command === 'docs') {
    await runDocsHandler(rest);
  } else if (command === 'merge') {
    await runMergeHandler(rest);
  } else {
    process.stderr.write(`Unknown repo command: ${command}\n`);
    process.exitCode = 1;
  }
}

export const repoToolingNamespace: ToolingNamespaceDefinition = {
  name: 'repo',
  description: 'Repository validation and maintenance workflows',
  commands,
  run: runNamespace,
};
