#!/usr/bin/env node
import { loadPiAgentModule, loadRepoAgentsModule } from '../../src/cdk-ai-runtime.js';

const repoAgents = await loadRepoAgentsModule();

const rawArgs = process.argv.slice(2);
if (rawArgs[0] === '--') rawArgs.shift();
const [command = 'help', ...args] = rawArgs;

try {
  if (command === 'models') await repoAgents.listModels();
  else if (command === 'validate-models') await repoAgents.validateModels(args);
  else if (command === 'config') await repoAgents.configure(args);
  else if (command === 'ask') await (await loadPiAgentModule()).runPiPrint({ promptArgs: args });
  else if (command === 'precommit') await repoAgents.runPrecommit(args);
  else if (command === 'commit') await repoAgents.runCommit(args);
  else if (command === 'docs-api') await repoAgents.runDocsApi(args);
  else if (command === 'docs-api-probe') await repoAgents.runDocsApiProbe(args);
  else if (command === 'readme-upkeep') await repoAgents.runDocsReadme(args);
  else if (command === 'package-pages') await repoAgents.runDocsPackagePages(args);
  else if (command === 'docs-upkeep') await repoAgents.runDocsUpkeep(args);
  else if (command === 'structure-upkeep') await repoAgents.runStructureUpkeep(args);
  else if (command === 'test-upkeep') await repoAgents.runTestUpkeep(args);
  else if (command === 'run') await repoAgents.runAction(args);
  else if (command === 'actions') await repoAgents.listActions();
  else printHelp();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

function printHelp(): void {
  console.log(`Usage: pnpm run llm -- <command>

Commands:
  models       List auto-discovered models
  validate-models Probe discovered models with cold/hot/json reliability checks
  config       Show or update local LLM config
  ask          Ask a repo-aware question through the PI print runtime
  precommit    Run hotspot + quality gates only
  commit       Run the local LLM commit pipeline
  run          Run a named delegated action
  actions      List delegated actions
  docs-api       Generate deterministic API.md skeletons then enrich with local LLM
  docs-api-probe Validate the docs-api package/model chain with a tiny probe request
  readme-upkeep      Scaffold missing READMEs then enrich with local LLM
  package-pages      Sync package MDX stubs then enrich docs-site pages with local LLM
  docs-upkeep        Run documentation upkeep recommendations
  structure-upkeep   Scaffold deterministic STRUCTURE.md files, then optionally enrich them
  test-upkeep        Run test coverage upkeep recommendations
`);
}
