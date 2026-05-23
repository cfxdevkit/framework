#!/usr/bin/env node
import { loadRepoAgentsModule } from '../src/cdk-ai-runtime.js';

const repoAgents = await loadRepoAgentsModule();

const commands = new Map([
  ['all', repoAgents.runAll],
  ['review', repoAgents.runReviewAgent],
  ['help', runHelp],
]);

const rawArgs = process.argv.slice(2);
if (rawArgs[0] === '--') rawArgs.shift();
const [command = 'help'] = rawArgs;

if (!commands.has(command)) {
  console.error(`Unknown llm agent command: ${command}`);
  runHelp();
  process.exit(1);
}

await commands.get(command)();

function runHelp() {
  console.log(`Usage: pnpm run llm -- <command>

Commands:
  all          Run all LLM repo upkeep agents
  review       Review current git changes and suggest validation commands
`);
}
