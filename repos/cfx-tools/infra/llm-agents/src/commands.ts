/**
 * Command handlers for @cfxdevkit/llm-agents CLI.
 *
 * Extracted from bin.ts to keep the main entry point under the file size limit.
 */

import { runPiCommit, runPiInteractive, runPiPrint, runPiRpc } from '@cfxdevkit/pi-agent';
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
import { isHelpToken, parseEndpointOverride, parseScopeFlag } from './helpers.js';

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

export async function handleChat(args: string[]): Promise<void> {
  const { endpoint, args: chatArgs } = parseEndpointOverride(args);
  const { args: sessionArgs } = parseScopeFlag(chatArgs);

  let scope: Parameters<typeof runPiInteractive>[0]['scope'];
  let promptArgs: string[] = [];

  if (sessionArgs.length > 0) {
    const scopeIndex = sessionArgs.indexOf('--scope');
    if (scopeIndex >= 0 && scopeIndex + 1 < sessionArgs.length) {
      scope = sessionArgs[scopeIndex + 1] as Parameters<typeof runPiInteractive>[0]['scope'];
      sessionArgs.splice(scopeIndex, 2);
    }
  }
  if (sessionArgs.length > 0) {
    promptArgs = sessionArgs;
  }

  if (endpoint) {
    process.env.PI_AGENT_ENDPOINT = endpoint;
  }

  await runPiInteractive({ scope, promptArgs });
}

export async function handleCommit(args: string[]): Promise<void> {
  const { endpoint, args: commitArgs } = parseEndpointOverride(args);
  const { args: sessionArgs } = parseScopeFlag(commitArgs);

  let scope: Parameters<typeof runPiCommit>[0]['scope'];
  let promptArgs: string[] = [];

  if (sessionArgs.length > 0) {
    const scopeIndex = sessionArgs.indexOf('--scope');
    if (scopeIndex >= 0 && scopeIndex + 1 < sessionArgs.length) {
      scope = sessionArgs[scopeIndex + 1] as Parameters<typeof runPiCommit>[0]['scope'];
      sessionArgs.splice(scopeIndex, 2);
    }
  }
  if (sessionArgs.length > 0) {
    promptArgs = sessionArgs;
  }

  if (endpoint) {
    process.env.PI_AGENT_ENDPOINT = endpoint;
  }

  await runPiCommit({ scope, promptArgs });
}

export async function handlePrint(args: string[]): Promise<void> {
  const dashIndex = args.indexOf('--');
  if (dashIndex < 0 || dashIndex === args.length - 1) {
    printPrintMode();
    return;
  }
  const endpointArgs = args.slice(0, dashIndex);
  const { endpoint } = parseEndpointOverride(endpointArgs);
  const promptText = args.slice(dashIndex + 1).join(' ');

  if (endpoint) {
    process.env.PI_AGENT_ENDPOINT = endpoint;
  }

  await runPiPrint({ promptArgs: [promptText] });
}

export async function handleRpc(args: string[]): Promise<void> {
  const { endpoint, args: rpcArgs } = parseEndpointOverride(args);
  const { args: sessionArgs } = parseScopeFlag(rpcArgs);

  let scope: Parameters<typeof runPiRpc>[0]['scope'];

  if (sessionArgs.length > 0) {
    const scopeIndex = sessionArgs.indexOf('--scope');
    if (scopeIndex >= 0 && scopeIndex + 1 < sessionArgs.length) {
      scope = sessionArgs[scopeIndex + 1] as Parameters<typeof runPiRpc>[0]['scope'];
    }
  }

  if (endpoint) {
    process.env.PI_AGENT_ENDPOINT = endpoint;
  }

  await runPiRpc({ scope });
}
