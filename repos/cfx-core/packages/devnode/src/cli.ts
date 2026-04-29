#!/usr/bin/env node
/**
 * `cfxdevkit-devnode` — minimal CLI to spin up a local Conflux node.
 *
 * Defaults match `@cfxdevkit/core/chains`'s `core-local` / `espace-local`,
 * so a freshly-bootstrapped showcase or `pnpm exec moon run :test` can talk
 * to `127.0.0.1:12537` (Core) and `127.0.0.1:8545` (eSpace) immediately.
 *
 * Usage:
 *
 * ```
 * cfxdevkit-devnode                 # default ports + 10 funded accounts
 * cfxdevkit-devnode --accounts 4 --balance 1000 --logging
 * cfxdevkit-devnode --no-mining     # disable auto-miner
 * ```
 */
import { createDevNode } from './node.js';
import type { DevNodeConfig } from './types.js';

interface ParsedArgs {
  config: DevNodeConfig;
  help: boolean;
  noMining: boolean;
}

function parseArgs(argv: string[]): ParsedArgs {
  const out: ParsedArgs = { config: {}, help: false, noMining: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = (): string => {
      const v = argv[i + 1];
      if (v === undefined) throw new Error(`missing value for ${a}`);
      i += 1;
      return v;
    };
    switch (a) {
      case '-h':
      case '--help':
        out.help = true;
        break;
      case '--core-port':
        out.config.coreRpcPort = Number(next());
        break;
      case '--espace-port':
        out.config.evmRpcPort = Number(next());
        break;
      case '--core-ws-port':
        out.config.coreWsPort = Number(next());
        break;
      case '--espace-ws-port':
        out.config.evmWsPort = Number(next());
        break;
      case '--chain-id':
        out.config.chainId = Number(next());
        break;
      case '--evm-chain-id':
        out.config.evmChainId = Number(next());
        break;
      case '--accounts':
        out.config.accounts = Number(next());
        break;
      case '--balance':
        out.config.balanceCfx = next();
        break;
      case '--mining-interval':
        out.config.miningIntervalMs = Number(next());
        break;
      case '--no-mining':
        out.noMining = true;
        break;
      case '--mnemonic':
        out.config.mnemonic = next();
        break;
      case '--data-dir':
        out.config.dataDir = next();
        break;
      case '--logging':
        out.config.logging = true;
        break;
      default:
        throw new Error(`unknown argument: ${a}`);
    }
  }
  if (out.noMining) out.config.miningIntervalMs = 0;
  return out;
}

function printHelp(): void {
  process.stdout.write(`cfxdevkit-devnode — local Conflux dev node

Options:
  --core-port <n>          Core JSON-RPC HTTP port (default 12537)
  --espace-port <n>        eSpace JSON-RPC HTTP port (default 8545)
  --core-ws-port <n>       Core JSON-RPC WS port (default 12536)
  --espace-ws-port <n>     eSpace JSON-RPC WS port (default 8546)
  --chain-id <n>           Core chain id (default 2029)
  --evm-chain-id <n>       eSpace chain id (default 2030)
  --accounts <n>           Pre-funded genesis accounts (default 10)
  --balance <cfx>          Initial CFX balance per account (default 1000000)
  --mining-interval <ms>   Auto-miner tick (default 2000, set 0 to disable)
  --no-mining              Shortcut for --mining-interval 0
  --mnemonic <words>       Override the random BIP-39 mnemonic
  --data-dir <path>        Override the data directory
  --logging                Forward @xcfx/node logs to stdout
  -h, --help               Show this help
`);
}

async function main(): Promise<void> {
  let parsed: ParsedArgs;
  try {
    parsed = parseArgs(process.argv.slice(2));
  } catch (e) {
    process.stderr.write(`error: ${e instanceof Error ? e.message : String(e)}\n\n`);
    printHelp();
    process.exit(2);
  }
  if (parsed.help) {
    printHelp();
    return;
  }

  const node = createDevNode(parsed.config);

  process.stdout.write('Starting Conflux dev node…\n');
  await node.start();

  process.stdout.write(`\n  core   ${node.urls.core}\n`);
  process.stdout.write(`  espace ${node.urls.espace}\n`);
  process.stdout.write(`  coreWs ${node.urls.coreWs}\n`);
  process.stdout.write(`  evmWs  ${node.urls.espaceWs}\n`);
  process.stdout.write(`  data   ${node.config.dataDir}\n\n`);

  process.stdout.write(`Mnemonic: ${node.config.mnemonic}\n`);
  process.stdout.write(`Faucet  : ${node.faucet.coreAddress} (${node.faucet.evmAddress})\n\n`);
  process.stdout.write(`Accounts (each funded with ${node.accounts[0]?.initialBalanceCfx} CFX):\n`);
  for (const a of node.accounts) {
    process.stdout.write(`  [${a.index}] ${a.evmAddress}  ${a.coreAddress}\n`);
  }

  if (node.getMiningStatus().enabled) {
    process.stdout.write(
      `\nAuto-miner: every ${node.getMiningStatus().intervalMs}ms (mine({ numTxs:1 }))\n`,
    );
  } else {
    process.stdout.write('\nAuto-miner: disabled\n');
  }
  process.stdout.write('\nReady. Press Ctrl+C to stop.\n');

  let stopping = false;
  const shutdown = async (signal: string) => {
    if (stopping) return;
    stopping = true;
    process.stdout.write(`\nReceived ${signal}, stopping…\n`);
    try {
      await node.stop();
    } catch (e) {
      process.stderr.write(`error during stop: ${e instanceof Error ? e.message : String(e)}\n`);
      process.exit(1);
    }
    process.exit(0);
  };
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

main().catch((e) => {
  process.stderr.write(`fatal: ${e instanceof Error ? e.stack || e.message : String(e)}\n`);
  process.exit(1);
});
