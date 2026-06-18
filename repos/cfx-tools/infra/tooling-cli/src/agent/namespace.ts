import { printModes, printStatus, runConfigCli } from '../agent/config.js';
import type { ToolingNamespaceDefinition } from '../contracts.js';
import { parseScopeFlag } from '../monorepo-units.js';
import { parseEndpointOverride, printAgentEndpoints, withEndpointOverride } from './endpoint.js';
import {
  agentCommands,
  printAgentHelp,
  printDeterministicHelp,
  printExploratoryHelp,
  printPrintMode,
  printProvidersStrategy,
} from './help.js';
import { runAgentMergeCli } from './merge.js';
import { isHelpToken, withAgentScope, withLlmAgents, withPiAgent } from './runtime.js';

export const agentToolingNamespace = {
  name: 'agent',
  description: 'Interactive agent runtime provider orchestration',
  commands: agentCommands,
  run: runAgentCli,
} as const satisfies ToolingNamespaceDefinition;

async function runAgentCli(rawArgs: readonly string[]): Promise<void> {
  const parsed = parseScopeFlag(rawArgs);
  const args = [...parsed.args];
  while (args[0] === '--') args.shift();

  const [command = 'help', ...rest] = args;
  if (isHelpToken(command)) {
    printAgentHelp();
    return;
  }

  if (command === 'smoke') {
    return await withAgentScope(parsed.scope, async () =>
      withLlmAgents((agents) => agents.runAgentSmoke(rest)),
    );
  }

  if (command === 'check') {
    return await withAgentScope(parsed.scope, async () => runAgentCheckCli(rest));
  }

  if (command === 'merge') {
    return await withAgentScope(parsed.scope, async () => runAgentMergeCli(rest));
  }

  if (command === 'endpoints') {
    return await withAgentScope(parsed.scope, async () => printAgentEndpoints(parsed.scope));
  }

  if (command === 'config')
    return await withAgentScope(parsed.scope, async () => runConfigCli(rest));

  if (command === 'modes') return await withAgentScope(parsed.scope, async () => printModes());

  if (command === 'status') return await withAgentScope(parsed.scope, async () => printStatus());

  if (command === 'chat' || command === 'commit') {
    const { endpoint, args: chatArgs } = parseEndpointOverride(rest);
    const promptArgs = normalizePromptArgs(chatArgs);

    // Session setup: no interactive prompts, just defaults
    // - endpoint: --override URL or null (uses base config)
    // - scope: from --scope flag or undefined (full repo)
    // - prompt: direct args or empty (starts interactive)
    const sessionOptions = {
      ...(parsed.scope ? { scope: parsed.scope } : {}),
      ...(promptArgs.length > 0 ? { promptArgs } : {}),
    };

    if (command === 'chat') {
      return await withEndpointOverride(endpoint, (piAgent) =>
        piAgent.runPiInteractive(sessionOptions),
      );
    }

    // commit: build commit session prompt
    const commitPrompt = buildCommitSessionPrompt(promptArgs);
    return await withEndpointOverride(endpoint, (piAgent) =>
      piAgent.runPiCommit({
        ...(parsed.scope ? { scope: parsed.scope } : {}),
        promptArgs: [commitPrompt],
      }),
    );
  }

  if (command === 'rpc') {
    return await withPiAgent((piAgent) =>
      piAgent.runPiRpc(parsed.scope ? { scope: parsed.scope } : {}),
    );
  }

  if (command === 'print') return await runPrintCli(rest);

  if (command === 'deterministic') return await runDeterministicCli(rest);

  if (command === 'exploratory') return await runExploratoryCli(rest);

  if (command === 'providers') return printProvidersStrategy();

  printAgentHelp();
}

async function runDeterministicCli(rawArgs: readonly string[]): Promise<void> {
  let args = [...rawArgs];
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
  if (workflow === 'wiki-generate') {
    return await withLlmAgents((agents) => agents.runWikiGenerate(rest));
  }

  throw new Error(`Unknown deterministic workflow: ${workflow}`);
}

async function runExploratoryCli(rawArgs: readonly string[]): Promise<void> {
  let args = [...rawArgs];
  while (args[0] === '--') args.shift();
  const [workflow = 'help'] = args;

  if (isHelpToken(workflow)) {
    printExploratoryHelp();
    return;
  }

  // exploratory workflows use llm-agents layer
  return await withLlmAgents((agents) => agents.runAll());
}

async function runPrintCli(rawArgs: readonly string[]): Promise<void> {
  let args = [...rawArgs];
  while (args[0] === '--') args.shift();

  if (args.length === 0 || isHelpToken(args[0] ?? '')) {
    printPrintMode();
    return;
  }

  await withPiAgent((piAgent) => piAgent.runPiPrint({ promptArgs: args }));
}

async function runAgentCheckCli(rawArgs: readonly string[]): Promise<void> {
  let args = [...rawArgs];
  while (args[0] === '--') args.shift();
  await withLlmAgents((agents) => agents.runAgentCheck(args));
}

function normalizePromptArgs(rawArgs: readonly string[]): string[] {
  let args = [...rawArgs];
  while (args[0] === '--') args.shift();
  return args;
}

function buildCommitSessionPrompt(promptArgs: readonly string[]): string {
  const operatorContext =
    promptArgs.length > 0 ? `\n\nOperator context: ${promptArgs.join(' ')}` : '';
  return (
    'Start an interactive repository commit session.' +
    'Run /repo-commit to begin the commit workflow inside PI.' +
    'Inspect repository-policy quality-gate status, keep session open for remediation.' +
    'Use shared repository workflows to stay in PI session while issues are resolved.' +
    operatorContext
  );
}
