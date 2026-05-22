import type { ToolingNamespaceDefinition } from './contracts.js';
import {
  agentCommands,
  printAgentHelp,
  printDeterministicHelp,
  printExploratoryHelp,
  printPrintMode,
  printProvidersStrategy,
  printRpcMode,
} from './agent-help.js';
import {
  printInteractiveMode,
  printModes,
  printStatus,
  runConfigCli,
} from './agent-config.js';
import {
  isHelpToken,
  isUnknownWorkflowError,
  withLlmAgents,
  withLlmClient,
} from './agent-runtime.js';

export const agentToolingNamespace = {
  name: 'agent',
  description: 'Interactive agent runtime and provider orchestration',
  commands: agentCommands,
  run: runAgentCli,
} as const satisfies ToolingNamespaceDefinition;

async function runAgentCli(rawArgs: readonly string[]): Promise<void> {
  const args = [...rawArgs];
  while (args[0] === '--') args.shift();

  const [command = 'help'] = args;
  if (isHelpToken(command)) {
    printAgentHelp();
    return;
  }

  if (command === 'config') return await runConfigCli(args.slice(1));
  if (command === 'modes') return await printModes();
  if (command === 'status') return await printStatus();
  if (command === 'deterministic') return await runDeterministicCli(args.slice(1));
  if (command === 'exploratory') return await runExploratoryCli(args.slice(1));
  if (command === 'interactive') return await runInteractiveCli(args.slice(1));
  if (command === 'print') return await runPrintCli(args.slice(1));
  if (command === 'rpc') return printRpcMode();
  if (command === 'providers') return printProvidersStrategy();

  printAgentHelp();
}

async function runDeterministicCli(rawArgs: readonly string[]): Promise<void> {
  const args = [...rawArgs];
  while (args[0] === '--') args.shift();

  const [workflow = 'help', ...rest] = args;
  if (isHelpToken(workflow)) {
    printDeterministicHelp();
    return;
  }

  if (workflow === 'models') return await withLlmAgents((agents) => agents.listModels());
  if (workflow === 'validate-models') {
    return await withLlmAgents((agents) => agents.validateModels(rest));
  }
  if (workflow === 'precommit') return await withLlmAgents((agents) => agents.runPrecommit(rest));
  if (workflow === 'docs-api') return await withLlmAgents((agents) => agents.runDocsApi(rest));
  if (workflow === 'docs-api-probe') {
    return await withLlmAgents((agents) => agents.runDocsApiProbe(rest));
  }
  if (workflow === 'readme-upkeep') {
    return await withLlmAgents((agents) => agents.runDocsReadme(rest));
  }
  if (workflow === 'package-pages') {
    return await withLlmAgents((agents) => agents.runDocsPackagePages(rest));
  }
  if (workflow === 'structure-upkeep') {
    return await withLlmAgents((agents) => agents.runStructureUpkeep(rest));
  }
  if (workflow === 'docs-upkeep') {
    return await withLlmAgents((agents) => agents.runDocsUpkeep(rest));
  }

  throw new Error(`Unknown deterministic workflow: ${workflow}`);
}

async function runExploratoryCli(rawArgs: readonly string[]): Promise<void> {
  const args = [...rawArgs];
  while (args[0] === '--') args.shift();

  const [workflow = 'help', ...rest] = args;
  if (isHelpToken(workflow)) {
    printExploratoryHelp();
    return;
  }

  if (workflow === 'print' || workflow === 'ask') return await runPrintCli(rest);
  if (workflow === 'review') return await withLlmAgents((agents) => agents.runReviewAgent());
  if (workflow === 'all') return await withLlmAgents((agents) => agents.runAll());
  if (workflow === 'test-upkeep') {
    return await withLlmAgents((agents) => agents.runTestUpkeep(rest));
  }
  if (workflow === 'commit') return await withLlmAgents((agents) => agents.runCommit(rest));
  if (workflow === 'actions') return await withLlmAgents((agents) => agents.listActions());
  if (workflow === 'action') return await withLlmAgents((agents) => agents.runAction(rest));
  if (workflow === 'test-audit') {
    return await withLlmAgents((agents) => agents.runAction(['test-audit', ...rest]));
  }
  if (workflow === 'health') {
    return await withLlmAgents((agents) => agents.runAction(['repo-health', ...rest]));
  }
  if (workflow === 'validation') {
    return await withLlmAgents((agents) => agents.runAction(['validation', ...rest]));
  }
  if (workflow === 'changeset') {
    return await withLlmAgents((agents) => agents.runAction(['changeset', ...rest]));
  }
  if (workflow === 'release') {
    return await withLlmAgents((agents) => agents.runAction(['release-readiness', ...rest]));
  }
  if (workflow === 'ci-cd') {
    return await withLlmAgents((agents) => agents.runAction(['ci-cd', ...rest]));
  }
  if (workflow === 'docs-pipeline') {
    return await withLlmAgents((agents) => agents.runAction(['docs-pipeline', ...rest]));
  }

  throw new Error(`Unknown exploratory workflow: ${workflow}`);
}

async function runInteractiveCli(rawArgs: readonly string[]): Promise<void> {
  const args = [...rawArgs];
  while (args[0] === '--') args.shift();

  if (args.length === 0 || isHelpToken(args[0] ?? '')) {
    await printInteractiveMode();
    return;
  }

  const config = await withLlmClient((client) => client.readConfig());
  if (config.harness.defaultMode === 'deterministic') {
    try {
      await runDeterministicCli(args);
      return;
    } catch (error) {
      if (!isUnknownWorkflowError(error, 'deterministic')) throw error;
    }
  }

  try {
    await runExploratoryCli(args);
    return;
  } catch (error) {
    if (!isUnknownWorkflowError(error, 'exploratory')) throw error;
  }

  if (config.harness.defaultMode === 'exploratory') {
    await runDeterministicCli(args);
    return;
  }

  throw new Error(`Unknown agent workflow: ${args[0]}`);
}

async function runPrintCli(rawArgs: readonly string[]): Promise<void> {
  const args = [...rawArgs];
  while (args[0] === '--') args.shift();

  if (args.length === 0 || isHelpToken(args[0] ?? '')) {
    printPrintMode();
    return;
  }

  await withLlmAgents((agents) => agents.ask(args));
}