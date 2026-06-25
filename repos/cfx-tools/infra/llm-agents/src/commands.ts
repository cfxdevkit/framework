/**
 * Command handlers for @cfxdevkit/llm-agents CLI.
 *
 * All PI agent runtime integration moved to @cfxdevkit/pi-customization.
 * This file handles only the standalone workflow commands.
 */

import { runAll } from '../workers/agents/all.js';
import { runAgentCheck } from '../workers/agents/check.js';
import { runReviewAgent } from '../workers/agents/review.js';
import { runAgentSmoke } from '../workers/agents/smoke.js';
import { configure, listModels, validateModels } from '../workers/commands.js';
import { parseCommitFlags, runPrecommitWorkflow } from '../workers/commit/index.js';
import { readConfig } from '../workers/completion/index.js';
import {
  runDocsApi,
  runDocsApiProbe,
  runDocsPackagePages,
  runDocsReadme,
  runStructureUpkeep,
} from '../workers/docs/index.js';
import { listRepoActions } from '../workers/shared/repo-actions.js';
import { runTestUpkeep } from '../workers/tests/index.js';
import { printDeterministicHelp, printExploratoryHelp, printPrintMode } from './help.js';
import { isHelpToken, parseScopeFlag } from './helpers.js';

export async function handleEndpoints(_args: string[]): Promise<void> {
  const config = await readConfig();
  console.log(`Endpoint readiness:

Lemonade (local):
  Base URL: ${config.baseUrl ?? 'n/a (check providers.json)'}`);
  console.log(`
PI Agent:
  Local endpoint: http://localhost:13305/ (default)
  Remote endpoint: configured via PI_AGENT_ENDPOINT or .pi/providers.json`);
}

export async function handleSmoke(args: string[]): Promise<void> {
  await runAgentSmoke(args);
}

export async function handleConfig(args: string[]): Promise<void> {
  await configure(args);
}

export async function handleStatus(): Promise<void> {
  const config = await readConfig();
  console.log(`Agent status`);
  console.log(`Provider: ${config.provider ?? 'not set'}`);
  console.log(`Default model: ${config.defaultModel ?? 'not set'}`);
  console.log(`Config path: ${process.env.CFXDEVKIT_LLM_CONFIG_PATH ?? 'default'}`);
  console.log(`Action policy: ${config.actionPolicies?.length ? 'configured' : 'default'}`);
}

export async function handleModes(): Promise<void> {
  console.log(`Operating modes:

Deterministic:
  - Constrained, reproducible agent workflows
  - Structured output expectations (JSON, markdown)
  - Suitable for automated CI/CD pipelines

Exploratory:
  - Broader maintenance and discovery workflows
  - Interactive, adaptive agent behavior
  - Suitable for iterative development`);
}

export async function handleCheck(args: string[]): Promise<void> {
  await runAgentCheck(args);
}

export async function handleMerge(args: string[]): Promise<void> {
  const { args: mergeArgs } = parseScopeFlag(args);
  if (mergeArgs.length === 0) {
    console.log('Usage: llm-agents merge [--dry-run] [--base <branch>] [branch...]');
    return;
  }
  const dryRun = mergeArgs.includes('--dry-run');
  const branchArgs = mergeArgs.filter((a) => a !== '--dry-run');
  console.log(`Merge validation (dry-run: ${dryRun}):`);
  console.log(`Branches: ${branchArgs.length > 0 ? branchArgs.join(', ') : '(all branches)'}`);
  console.log('Use `moon run repo-merge` for full merge operations.');
}

export async function handleDeterministic(args: string[]): Promise<void> {
  const { args: detArgs } = parseScopeFlag(args);
  const [workflow = 'help', ...rest] = detArgs;

  if (isHelpToken(workflow)) {
    printDeterministicHelp();
    return;
  }

  const filteredArgs = rest.filter((a) => !a.startsWith('--scope'));

  switch (workflow) {
    case 'models':
      await listModels();
      break;
    case 'validate-models':
      await validateModels(filteredArgs);
      break;
    case 'precommit': {
      const flags = parseCommitFlags(filteredArgs);
      const result = await runPrecommitWorkflow(flags);
      if (result.status === 'blocked') process.exitCode = 1;
      break;
    }
    case 'docs-api':
      await runDocsApi(filteredArgs);
      break;
    case 'docs-api-probe':
      await runDocsApiProbe(filteredArgs);
      break;
    case 'readme-upkeep':
      await runDocsReadme(filteredArgs);
      break;
    case 'package-pages':
      await runDocsPackagePages(filteredArgs);
      break;
    case 'structure-upkeep':
      await runStructureUpkeep(filteredArgs);
      break;
    case 'docs-upkeep':
      await runDocsReadme(filteredArgs);
      break;
    default:
      console.error(`Unknown deterministic workflow: ${workflow}`);
      printDeterministicHelp();
      process.exitCode = 1;
  }
}

export async function handleExploratory(args: string[]): Promise<void> {
  const { args: expArgs } = parseScopeFlag(args);
  const [workflow = 'help', ...rest] = expArgs;

  if (isHelpToken(workflow)) {
    printExploratoryHelp();
    return;
  }

  switch (workflow) {
    case 'all':
      await runAll();
      break;
    case 'actions': {
      const actions = listRepoActions();
      if (Array.isArray(actions)) {
        console.log(`Available repo actions (${actions.length}):`);
        for (const action of actions) {
          console.log(`  ${action.name.padEnd(30)} ${action.description}`);
        }
      }
      break;
    }
    case 'action': {
      if (rest.length === 0) {
        console.log('Usage: llm-agents exploratory action <name> [args]');
        return;
      }
      console.log(`Exploratory action: ${rest[0]}`);
      break;
    }
    case 'changeset':
    case 'test-audit':
    case 'test-upkeep':
      await runTestUpkeep(rest);
      break;
    case 'ci-cd':
    case 'docs-pipeline':
    case 'release':
      await runAll();
      break;
    case 'docs-upkeep':
      await runDocsReadme(rest);
      break;
    case 'health':
    case 'validation':
      await runReviewAgent();
      break;
    default:
      console.error(`Unknown exploratory workflow: ${workflow}`);
      printExploratoryHelp();
      process.exitCode = 1;
  }
}

export async function handleChat(_args: string[]): Promise<void> {
  console.error('Chat mode has been removed. Use PI interactive mode instead.');
  printPrintMode();
  process.exitCode = 1;
}

export async function handleCommit(_args: string[]): Promise<void> {
  console.error('Commit mode has been removed. Use PI commit workflow instead.');
  console.log(`Usage: /repo-commit [--quick] [--model <id>] [prompt]`);
  console.log(`Or use PI interactive: pi`);
  console.log(`Then: /repo-commit`);
  process.exitCode = 1;
}

export async function handlePrint(_args: string[]): Promise<void> {
  console.error('Print mode has been removed. Use PI print mode instead.');
  printPrintMode();
  process.exitCode = 1;
}

export async function handleRpc(_args: string[]): Promise<void> {
  console.error('RPC mode has been removed. Use PI RPC mode instead.');
  console.log(`Usage: pi --mode rpc`);
  process.exitCode = 1;
}
