#!/usr/bin/env node
import {
  ask,
  configure,
  listActions,
  listModels,
  runAction,
  runCommit,
  runDocsUpkeep,
  runPrecommit,
  runTestUpkeep,
} from '@cfxdevkit/llm-agents';

const rawArgs = process.argv.slice(2);
if (rawArgs[0] === '--') rawArgs.shift();
const [command = 'help', ...args] = rawArgs;

try {
  if (command === 'models') await listModels();
  else if (command === 'config') await configure(args);
  else if (command === 'ask') await ask(args);
  else if (command === 'precommit') await runPrecommit(args);
  else if (command === 'commit') await runCommit(args);
  else if (command === 'docs-upkeep') await runDocsUpkeep(args);
  else if (command === 'test-upkeep') await runTestUpkeep(args);
  else if (command === 'run') await runAction(args);
  else if (command === 'actions') listActions();
  else printHelp();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

function printHelp(): void {
  console.log(`Usage: pnpm run llm -- <command>

Commands:
  models       List auto-discovered models
  config       Show or update local LLM config
  ask          Ask a repo-aware local LLM question
  precommit    Run hotspot + quality gates only
  commit       Run the local LLM commit pipeline
  run          Run a named delegated action
  actions      List delegated actions
  docs-upkeep  Run documentation upkeep recommendations
  test-upkeep  Run test coverage upkeep recommendations
`);
}
