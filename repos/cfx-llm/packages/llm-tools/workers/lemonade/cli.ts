#!/usr/bin/env node
// @ts-nocheck
import { ask, configure, listActions, listModels, runAction } from './commands.ts';
import { runCommit, runPrecommit } from './commit/index.ts';
import { runDocsUpkeep } from './docs/index.ts';
import { help } from './help.ts';
import { runTestUpkeep } from './tests/index.ts';

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
  else help();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
