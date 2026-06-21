#!/usr/bin/env node

/**
 * CLI entry point for @cfxdevkit/llm-agents.
 *
 * This replaces the old cdk agent/llm namespace commands that were removed
 * during the cli-redesign. Each subcommand delegates to the appropriate
 * worker module.
 *
 * Usage:
 *   pnpm run llm-agents <subcommand> [args...]
 *   pnpm exec @cfxdevkit/llm-agents <subcommand> [args...]
 */

// ─── Imports ─────────────────────────────────────────────────────────────────

import {
  handleChat,
  handleCheck,
  handleCommit,
  handleConfig,
  handleDeterministic,
  handleEndpoints,
  handleExploratory,
  handleMerge,
  handleModes,
  handlePrint,
  handleRpc,
  handleSmoke,
  handleStatus,
} from './commands.js';
import { printMainHelp, printProvidersStrategy } from './help.js';

// ─── Main CLI ────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const rawArgs = process.argv.slice(2);
  const args = [...rawArgs];
  while (args[0] === '--') args.shift();

  if (args.length === 0 || args[0] === 'help' || args[0] === '--help' || args[0] === '-h') {
    printMainHelp();
    return;
  }

  const [command = '', ...rest] = args;

  switch (command) {
    case 'smoke':
      await handleSmoke(rest);
      break;
    case 'config':
      await handleConfig(rest);
      break;
    case 'status':
      await handleStatus();
      break;
    case 'modes':
      await handleModes();
      break;
    case 'endpoints':
      await handleEndpoints(rest);
      break;
    case 'providers':
      printProvidersStrategy();
      break;
    case 'check':
      await handleCheck(rest);
      break;
    case 'merge':
      await handleMerge(rest);
      break;
    case 'deterministic':
      await handleDeterministic(rest);
      break;
    case 'exploratory':
      await handleExploratory(rest);
      break;
    case 'chat':
      await handleChat(rest);
      break;
    case 'commit':
      await handleCommit(rest);
      break;
    case 'print':
      await handlePrint(rest);
      break;
    case 'rpc':
      await handleRpc(rest);
      break;
    default:
      console.error(`Unknown command: ${command}`);
      printMainHelp();
      process.exitCode = 1;
  }
}

await main();
