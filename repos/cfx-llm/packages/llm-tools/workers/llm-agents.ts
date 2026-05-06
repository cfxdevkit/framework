#!/usr/bin/env node
// @ts-nocheck
import { runAll } from './agents/all.ts';
import { runCiCdAgent } from './agents/cicd.ts';
import { runCorpusAgent } from './agents/corpus.ts';
import { runDocsAgent } from './agents/docs.ts';
import { runEvalAgent, runServeCheckAgent } from './agents/eval-serve.ts';
import { runReviewAgent } from './agents/review.ts';

const commands = new Map([
  ['all', runAll],
  ['ci', runCiCdAgent],
  ['corpus', runCorpusAgent],
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
  ci           Check CI/CD, docs image, release, and VPS deploy wiring
  corpus       Build file/chunk/doc metadata under artifacts/llm/corpus
  docs         Check doc path references, package exports, and Moon registration
  eval         Summarize deterministic agent gates
  review       Review current git changes and suggest validation commands
  serve-check  Check Lemonade Server reachability without starting training
`);
}
