import { parseArgs } from './args.js';
import { addressFromFlags } from './commands/address.js';
import { chainFromFlags } from './commands/chain.js';
import { contractsExtractFromFlags } from './commands/contracts.js';
import { deriveFromFlags } from './commands/derive.js';
import { generateFromFlags } from './commands/generate.js';
import { keystoreFromFlags } from './commands/keystore.js';
import { statusFromFlags } from './commands/status.js';
import { unitsFromFlags } from './commands/units.js';

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

  contracts extract                 Extract ABI + bytecode from Hardhat artifacts
    [--artifacts <dir>]             Source directory (default: artifacts)
    [--out <dir>]                   Output directory (default: src/generated/contracts)

  chain list [--family <core|espace>] [--network <mainnet|testnet|devnet|local>] [--json]
  chain show <id|name> [--json]
  chain resolve <alias|id|name> [--json]

  address validate <address> [--json]
  address convert --to <hex|base32> <address> [--network-id <id>] [--json]
  address normalize <address> [--json]

  keystore status [--name <signer>] [--cwd <dir>] [--json]
  keystore list [--cwd <dir>] [--json]
  keystore use <name> [--cwd <dir>] [--json]
  keystore set <name> --kind <memory|file-keystore|onekey|ledger> [flags] [--default] [--cwd <dir>] [--json]
  keystore read [--name <signer>] [--keystore <path>] [--passphrase-env <env>] [--service <name>] [--account <name>] [--account-index <n>] [--cwd <dir>] [--json]
  keystore ping [--name <signer>] [--message <text>] [--cwd <dir>] [--json]
  keystore mnemonic <generate|validate|derive|add> [flags]

  units parse --unit <cfx|drip|gdrip> <value> [--json]
  units format --unit <cfx|drip|gdrip> <value> [--json]

Global flags:
  --json                            Emit machine-readable JSON
  --help                            Print this help

Examples:
  cfx status
  cfx status --chain core-testnet
  cfx derive --generate --count 3 --core-network-id 1
  cfx derive --mnemonic "test test test test test test test test test test test junk"
  cfx contracts extract --artifacts ./artifacts --out ./src/generated/contracts
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
      case 'contracts': {
        const subcommand = parsed.positionals[0] ?? '';
        if (subcommand === 'extract') {
          return await contractsExtractFromFlags(parsed.flags, opts);
        }
        stderr.write(`cfx contracts: unknown subcommand "${subcommand}"\n\n${HELP}`);
        return 2;
      }
      case 'chain':
        return await chainFromFlags(parsed.flags, stdout);
      case 'address':
        return await addressFromFlags(parsed.flags, stdout);
      case 'keystore':
        return await keystoreFromFlags(parsed.flags, stdout);
      case 'units':
        return await unitsFromFlags(parsed.flags, stdout);
      default:
        stderr.write(`cfx: unknown command "${parsed.command}"\n\n${HELP}`);
        return 2;
    }
  } catch (err) {
    stderr.write(`cfx: ${err instanceof Error ? err.message : String(err)}\n`);
    return 1;
  }
}
