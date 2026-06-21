/**
 * Keystore tooling namespace - entry point.
 *
 * Delegates to extracted command modules.
 */

import type { ToolingNamespaceDefinition } from '../contracts.js';
import { handleCast } from './keystore-cast-commands.js';
import { handleList, handleSet, handleStatus, handleUse } from './keystore-config-commands.js';
import { handleMnemonic } from './keystore-mnemonic-commands.js';
import { handlePing, handleRead } from './keystore-session-commands.js';

const commands = [
  {
    name: 'status',
    description: 'Show active signer/keystore status',
    usage: 'status [--name <signer>] [--cwd <dir>] [--json]',
  },
  {
    name: 'list',
    description: 'List configured signers in .cfxdevkit/signer.json',
    usage: 'list [--cwd <dir>] [--json]',
  },
  {
    name: 'use',
    description: 'Set default signer in config',
    usage: 'use <name> [--cwd <dir>] [--json]',
  },
  {
    name: 'set',
    description: 'Create or update a signer entry',
    usage:
      'set <name> --kind <memory|file-keystore|onekey|ledger> [flags] [--default] [--cwd <dir>] [--json]',
  },
  {
    name: 'read',
    description: 'Load signer session and print resolved addresses',
    usage:
      'read [--name <signer>] [--keystore <path>] [--passphrase-env <env>] [--service <name>] [--account <name>] [--account-index <n>] [--cwd <dir>] [--json]',
  },
  {
    name: 'ping',
    description: 'Validate active signer is reachable by signing a probe message',
    usage: 'ping [--name <signer>] [--message <text>] [--cwd <dir>] [--json]',
  },
  {
    name: 'cast',
    description: 'Use active signer for tier-0 signing and submit actions',
    usage: 'cast <message|typed-data|tx> [flags]',
  },
  {
    name: 'mnemonic',
    description: 'Generate, validate, and derive accounts from mnemonic phrases',
    usage: 'mnemonic <generate|validate|derive|add> [flags]',
  },
] as const;

const helpText = `Usage: cdk keystore <command> [args]
       pnpm cdk -- keystore <command> [args]

Commands:
  status [--name <signer>] [--cwd <dir>] [--json]
  list [--cwd <dir>] [--json]
  use <name> [--cwd <dir>] [--json]
  set <name> --kind <memory|file-keystore|onekey|ledger> [flags] [--default] [--cwd <dir>] [--json]
  read [--name <signer>] [--keystore <path>] [--passphrase-env <env>] [--service <name>] [--account <name>] [--account-index <n>] [--cwd <dir>] [--json]
  ping [--name <signer>] [--message <text>] [--cwd <dir>] [--json]
  cast message <text> [--name <signer>] [--cwd <dir>] [--json]
  cast typed-data --file <path> [--name <signer>] [--cwd <dir>] [--json]
  cast tx --chain <id|name> --file <path> [--rpc-url <url>] [--name <signer>] [--cwd <dir>] [--dry-run] [--json]
  mnemonic generate [--strength 128|160|192|224|256] [--json]
  mnemonic validate [--mnemonic <phrase>] [--mnemonic-env <env>] [--json]
  mnemonic derive [--mnemonic <phrase>] [--mnemonic-env <env>] [--index <n>] [--account-type <standard|mining>] [--core-network-id <id>] [--passphrase-env <env>] [--show-private-key] [--json]
  mnemonic add --name <signer> [--mnemonic <phrase>|--mnemonic-env <env>] [--keystore <path>] [--passphrase-env <env>] [--service <name>] [--account <name>] [--account-index <n>] [--default] [--cwd <dir>] [--json]

Examples:
  cdk keystore list
  cdk keystore set deployer --kind file-keystore --path .cfxdevkit/keystore.json --service cfxdevkit --account deployer --default
  cdk keystore use deployer
  cdk keystore read --name deployer
  cdk keystore ping --name deployer
  cdk keystore cast message "hello from cdk"
  cdk keystore mnemonic generate --strength 256
  cdk keystore mnemonic add --name wallet-0 --mnemonic-env CFX_MNEMONIC --passphrase-env CFX_PASSPHRASE --account-index 0 --default
  CFX_PASSPHRASE=secret cdk keystore read --keystore .cfxdevkit/keystore.json
`;

export const keystoreToolingNamespace: ToolingNamespaceDefinition = {
  name: 'keystore',
  description: 'Signer config and keystore session management',
  commands,
  async run(rawArgs) {
    const args = [...rawArgs];
    while (args[0] === '--') args.shift();
    const [command = 'help', ...rest] = args;
    const json = rest.includes('--json');

    if (command === 'help' || command === '--help' || command === '-h') {
      console.log(helpText);
      return;
    }

    const handlerMap: Record<string, (...a: unknown[]) => Promise<void>> = {
      status: () => handleStatus(rest, json),
      list: () => handleList(rest, json),
      use: () => handleUse(rest, json),
      set: () => handleSet(rest, json),
      read: () => handleRead(rest, json),
      ping: () => handlePing(rest, json),
      cast: () => handleCast(rest),
      mnemonic: () => handleMnemonic(rest),
    };

    const handler = handlerMap[command];
    if (!handler) {
      console.error(`Unknown keystore command: ${command}`);
      console.log(helpText);
      process.exitCode = 1;
      return;
    }

    await handler();
  },
};
