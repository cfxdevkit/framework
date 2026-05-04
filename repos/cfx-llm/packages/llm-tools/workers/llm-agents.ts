#!/usr/bin/env node
// @ts-nocheck
import { runAll } from './agents/all.ts';
import { runCorpusAgent, runDatasetAgent } from './agents/corpus.ts';
import { runDocsAgent } from './agents/docs.ts';
import { runEvalAgent, runServeCheckAgent } from './agents/eval-serve.ts';
import { runReviewAgent } from './agents/review.ts';

const commands = new Map([
  ['all', runAll],
  ['corpus', runCorpusAgent],
  ['datasets', runDatasetAgent],
  ['docs', runDocsAgent],
  ['eval', runEvalAgent],
  ['review', runReviewAgent],
  ['serve-check', runServeCheckAgent],
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
  all          Run all deterministic repo upkeep agents
  corpus       Build file/chunk/doc metadata under artifacts/llm/corpus
  datasets     Build small deterministic eval seed data, not training data
  docs         Check doc path references, package exports, and Moon registration
  eval         Summarize deterministic agent gates
  review       Review current git changes and suggest validation commands
  serve-check  Check Lemonade Server reachability without starting training
`);
}
