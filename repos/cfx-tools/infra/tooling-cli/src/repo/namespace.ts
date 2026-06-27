import type { RepoCheckTarget } from '@cfxdevkit/cdk-repo-check';
import { defaultRenderer, runRepoCheck } from '@cfxdevkit/cdk-repo-check';
import type { ToolingCommandDefinition, ToolingNamespaceDefinition } from '../contracts.js';
import { docsCommand, runDocsHandler } from './docs-commands.js';

// ─── check command ────────────────────────────────────────────────────────────

async function runCheckHandler(args: readonly string[]): Promise<void> {
  const hasHelp = args.some((a) => a === '--help' || a === '-h' || a === 'help');
  if (hasHelp) {
    process.stdout.write(
      'Usage: repo check [target] [options]\n' +
        '\n' +
        'Targets:\n' +
        '  validation    Run full validation pipeline (default)\n' +
        '  hotspots      File line-count hotspot scan\n' +
        '  kebab-groups  Kebab-case sibling group check\n' +
        '  unit-configs  Unit configuration drift check\n' +
        '\n' +
        'Validation steps (use --step with validation target):\n' +
        '  gitnexus-analyze  GitNexus index analysis\n' +
        '  format            Biome format write\n' +
        '  lint              Biome lint check\n' +
        '  typecheck         TypeScript type check\n' +
        '  test              Run test suite\n' +
        '  build             Build all packages\n' +
        '  hotspots          File line-count hotspot scan\n' +
        '  kebab-groups      Kebab-case sibling group check\n' +
        '  check             Repo check (moon :check)\n' +
        '\n' +
        'Options:\n' +
        '  --step <id>       Run only this validation step (repeatable)\n' +
        '  --fail-on-hard    Exit with code 1 on hard errors\n' +
        '  --quick           Run only fast checks\n' +
        '  --json            Emit JSON output\n' +
        '\n' +
        'Examples:\n' +
        '  repo check                            Run full validation\n' +
        '  repo check hotspots                   Run hotspot scan only\n' +
        '  repo check validation --step lint     Run lint step only\n' +
        '  repo check validation --step hotspots --step kebab-groups  Run 2 steps\n',
    );
    return;
  }

  const [target = 'validation', ...rest] = args;
  const validTargets = ['validation', 'hotspots', 'kebab-groups', 'unit-configs'];

  if (!validTargets.includes(target)) {
    process.stderr.write(`Unknown target: ${target}\n`);
    process.stderr.write(`Valid targets: ${validTargets.join(', ')}\n`);
    process.exitCode = 1;
    return;
  }

  // Filter out --quick (handled locally, not by cdk-repo-check)
  const filteredArgs = rest.filter((a) => a !== '--quick');
  const result = await runRepoCheck(target as RepoCheckTarget, filteredArgs);

  // Render with failure details
  const text = renderCheckResult(result);
  process.stdout.write(`${text}\n`);

  if (result.status === 'error') {
    process.exitCode = 1;
  }
}

function renderCheckResult(result: Awaited<ReturnType<typeof runRepoCheck>>): string {
  const base = defaultRenderer.renderText(
    result as Parameters<typeof defaultRenderer.renderText>[0],
  );

  // For validation results, append failure details
  if (
    (result as { command?: { action: string; target: string } }).command?.target === 'validation'
  ) {
    const validationResult = result as {
      report?: {
        steps?: Array<{
          id: string;
          label: string;
          status: string;
          details?: {
            stdoutTail?: string[];
            stderrTail?: string[];
            hardViolations?: Array<{ path: string; lines: number }>;
            softWarnings?: Array<{ path: string; lines: number }>;
            groups?: Array<{ directory: string; prefix: string; files: string[] }>;
          };
          durationMs?: number;
        }>;
      };
    };
    const failedSteps = validationResult.report?.steps?.filter((s) => s.status === 'error');
    if (failedSteps && failedSteps.length > 0) {
      const lines = [base, ''];
      for (const step of failedSteps) {
        const d = step.details;
        lines.push(`  ✗ ${step.label}:`);
        if (d?.hardViolations && d.hardViolations.length > 0) {
          for (const v of d.hardViolations) {
            lines.push(`    ! ${v.path} (${v.lines} lines)`);
          }
        }
        if (d?.stdoutTail && d.stdoutTail.length > 0) {
          for (const line of d.stdoutTail.slice(0, 6)) {
            lines.push(`    ${line}`);
          }
        }
        if (d?.stderrTail && d.stderrTail.length > 0) {
          for (const line of d.stderrTail.slice(0, 6)) {
            lines.push(`    ${line}`);
          }
        }
      }
      return lines.join('\n');
    }
  }

  return base;
}

const checkCommand: ToolingCommandDefinition = {
  name: 'check',
  description: 'Run repository validation',
  usage: '[target] [--step <id>] [--fail-on-hard] [--quick] [--json]',
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
