import { parseArgs } from './args.js';
import { deriveFromFlags } from './commands/derive.js';
import { generateFromFlags } from './commands/generate.js';
import { statusFromFlags } from './commands/status.js';

const HELP = `cfx — Conflux developer CLI

Usage:
  cfx <command> [options]

Commands:
  status                            Ping every known chain
  status --chain <id|name>          Ping a single chain
  status --chain <c> --rpc <url>    Override the RPC endpoint

  derive --mnemonic "<phrase>"      Derive accounts from a mnemonic
  derive --generate                 Generate a fresh mnemonic + derive
    [--count N]                     How many indices to derive (default 1)
    [--start I]                     Starting address-index (default 0)
    [--type standard|mining]        Account-type segment (default standard)
    [--core-network-id <id>]        1029 (main) | 1 (test) | 2029 (local)
    [--passphrase "<pass>"]         BIP-39 passphrase
    [--show-private-keys]           Include private keys in output
    [--show-mnemonic]               Include the mnemonic when not --generate
    [--strength 128|256]            Mnemonic strength when --generate

  generate [--strength 128|256]     Print a fresh BIP-39 mnemonic

Global flags:
  --json                            Emit machine-readable JSON
  --help                            Print this help

Examples:
  cfx status
  cfx status --chain core-testnet
  cfx derive --generate --count 3 --core-network-id 1
  cfx derive --mnemonic "test test test test test test test test test test test junk"
`;

export interface RunOptions {
  stdout?: NodeJS.WritableStream;
  stderr?: NodeJS.WritableStream;
}

export async function run(argv: readonly string[], opts: RunOptions = {}): Promise<number> {
  const stdout = opts.stdout ?? process.stdout;
  const stderr = opts.stderr ?? process.stderr;
  const parsed = parseArgs(argv);

  if (parsed.flags.help === true || parsed.command === 'help' || parsed.command === undefined) {
    stdout.write(HELP);
    return parsed.command === undefined && parsed.flags.help !== true ? 1 : 0;
  }

  try {
    switch (parsed.command) {
      case 'status':
        return await statusFromFlags(parsed.flags, stdout);
      case 'derive':
        return deriveFromFlags(parsed.flags, stdout);
      case 'generate':
        return generateFromFlags(parsed.flags, stdout);
      default:
        stderr.write(`cfx: unknown command "${parsed.command}"\n\n${HELP}`);
        return 2;
    }
  } catch (err) {
    stderr.write(`cfx: ${err instanceof Error ? err.message : String(err)}\n`);
    return 1;
  }
}
