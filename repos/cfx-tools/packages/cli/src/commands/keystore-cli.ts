/**
 * Keystore CLI entry point.
 *
 * Routes subcommands to config, session, and mnemonic modules.
 */

import {
  keystoreListFromFlags,
  keystoreSetFromFlags,
  keystoreStatusFromFlags,
  keystoreUseFromFlags,
} from './keystore-config.js';
import { keystoreMnemonicFromFlags } from './keystore-mnemonic.js';
import { keystorePingFromFlags, keystoreReadFromFlags } from './keystore-session.js';

const HELP = `cfx keystore — Signer config and keystore session management

Usage:
  cfx keystore status [--name <signer>] [--cwd <dir>] [--json]
  cfx keystore list [--cwd <dir>] [--json]
  cfx keystore use <name> [--cwd <dir>] [--json]
  cfx keystore set <name> --kind <memory|file-keystore|onekey|ledger> [flags] [--default] [--cwd <dir>] [--json]
  cfx keystore read [--name <signer>] [--keystore <path>] [--passphrase-env <env>] [--service <name>] [--account <name>] [--account-index <n>] [--cwd <dir>] [--json]
  cfx keystore ping [--name <signer>] [--message <text>] [--cwd <dir>] [--json]
  cfx keystore mnemonic generate [--strength 128|160|192|224|256] [--json]
  cfx keystore mnemonic validate [--mnemonic <phrase>] [--mnemonic-env <env>] [--json]
  cfx keystore mnemonic derive [--mnemonic <phrase>] [--mnemonic-env <env>] [--index <n>] [--account-type <standard|mining>] [--core-network-id <id>] [--passphrase-env <env>] [--show-private-key] [--json]
  cfx keystore mnemonic add --name <signer> [--mnemonic <phrase>|--mnemonic-env <env>] [--keystore <path>] [--passphrase-env <env>] [--service <name>] [--account <name>] [--account-index <n>] [--default] [--cwd <dir>] [--json]

Examples:
  cfx keystore list
  cfx keystore set deployer --kind file-keystore --path .cfxdevkit/keystore.json --service cfxdevkit --account deployer --default
  cfx keystore use deployer
  cfx keystore read --name deployer
  cfx keystore ping --name deployer
  cfx keystore mnemonic generate --strength 256
  CFX_PASSPHRASE=secret cfx keystore read --keystore .cfxdevkit/keystore.json
`;

export function keystoreFromFlags(
  flags: Record<string, string | boolean>,
  stdout: NodeJS.WritableStream,
): Promise<number> {
  const subcommand = flags._ ?? '';

  if (subcommand === 'help' || subcommand === '') {
    stdout.write(HELP);
    return Promise.resolve(1);
  }

  if (subcommand === 'status') return keystoreStatusFromFlags(flags, stdout);
  if (subcommand === 'list') return keystoreListFromFlags(flags, stdout);
  if (subcommand === 'use') return keystoreUseFromFlags(flags, stdout);
  if (subcommand === 'set') return keystoreSetFromFlags(flags, stdout);
  if (subcommand === 'read') return keystoreReadFromFlags(flags, stdout);
  if (subcommand === 'ping') return keystorePingFromFlags(flags, stdout);
  if (subcommand === 'mnemonic') return keystoreMnemonicFromFlags(flags, stdout);

  stdout.write(`cfx keystore: unknown subcommand "${subcommand}"\n\n${HELP}`);
  return Promise.resolve(2);
}
