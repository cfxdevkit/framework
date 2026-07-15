/**
 * Documentation commands for repo CLI.
 *
 * Extracted from namespace.ts to reduce file complexity.
 */

import type { ToolingCommandDefinition } from '../contracts.js';

// ─── docs generate ───────────────────────────────────────────────────────────

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

export const docsGenerateCommand: ToolingCommandDefinition = {
  name: 'generate',
  description: 'Run deterministic doc generation (skeleton only, no LLM)',
  usage: '[all|api|readme|structure|packages]',
};

// ─── docs validate ────────────────────────────────────────────────────────────

async function runDocsValidateHandler(args: readonly string[]): Promise<void> {
  const { runRepoCommand, defaultRenderer } = await import('@cfxdevkit/cdk-repo-check');
  const result = await runRepoCommand('check-docs', args);
  const text = defaultRenderer.renderText(result);
  process.stdout.write(`${text}\n`);
  if (result.status === 'error') {
    process.exitCode = 1;
  }
}

export const docsValidateCommand: ToolingCommandDefinition = {
  name: 'validate',
  description: 'Validate docs build, wiki sync, image, and deploy flow',
  usage: '[content|packages|wiki|all] [args]',
};

// ─── docs handler ─────────────────────────────────────────────────────────────

export async function runDocsHandler(args: readonly string[]): Promise<void> {
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

export const docsCommand: ToolingCommandDefinition = {
  name: 'docs',
  description: 'Documentation operations',
  usage: '<generate|validate> [args]',
};
