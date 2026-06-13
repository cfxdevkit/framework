import { createSignerSession, createSignerSessionFromConfig } from '@cfxdevkit/signer-session';
import { isHelpToken } from './agent/runtime.js';
import type { ToolingNamespaceDefinition } from './contracts.js';

const SIGN_COMMANDS = [
  {
    name: 'message',
    description: 'Sign a UTF-8 message and print the hex signature',
    usage:
      'sign message <text> [--space espace|core] [--keystore <path>] [--account <name>] [--json]',
  },
  {
    name: 'typed-data',
    description: 'Sign an EIP-712 / CIP-23 typed-data JSON file and print the hex signature',
    usage: 'sign typed-data <json-file> [--space espace|core] [--keystore <path>] [--json]',
  },
] as const;

export const signToolingNamespace: ToolingNamespaceDefinition = {
  name: 'sign',
  description: 'Headless signing from file keystore or private key (no devnode-server required)',
  commands: SIGN_COMMANDS,
  run: runSignCli,
};

async function runSignCli(args: readonly string[]): Promise<void> {
  const [sub, ...rest] = args;

  if (!sub || isHelpToken(sub)) {
    printSignHelp();
    return;
  }

  if (sub === 'message') {
    await runSignMessage(rest);
    return;
  }

  if (sub === 'typed-data') {
    await runSignTypedData(rest);
    return;
  }

  process.stderr.write(`Unknown sign subcommand: '${sub}'\n`);
  printSignHelp();
  process.exitCode = 1;
}

interface SignFlags {
  space: 'espace' | 'core';
  json: boolean;
  keystore?: string;
  account?: string;
}

function parseSignFlags(args: readonly string[]): { positional: string[]; flags: SignFlags } {
  const positional: string[] = [];
  const flags: SignFlags = { space: 'espace', json: false };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (!arg) continue;
    if (arg === '--json') {
      flags.json = true;
      continue;
    }
    if (arg === '--space' && args[i + 1]) {
      const nextI = ++i;
      flags.space = (args[nextI] as string) === 'core' ? 'core' : 'espace';
      continue;
    }
    if (arg === '--keystore' && args[i + 1]) {
      flags.keystore = args[++i] as string;
      continue;
    }
    if (arg === '--account' && args[i + 1]) {
      flags.account = args[++i] as string;
      continue;
    }
    positional.push(arg);
  }

  return { positional, flags };
}

async function buildSession(flags: SignFlags) {
  // Priority: explicit flags > env vars > signer config file
  if (flags.keystore !== undefined || process.env.CFX_KEYSTORE_PATH) {
    // Explicit flag or env var: use file-keystore directly
    return createSignerSession({
      kind: 'file-keystore',
      ...(flags.keystore !== undefined ? { path: flags.keystore } : {}),
      ...(flags.account !== undefined ? { account: flags.account } : {}),
    });
  }
  // Fall back to signer config
  return createSignerSessionFromConfig();
}

async function runSignMessage(args: readonly string[]): Promise<void> {
  const { positional, flags } = parseSignFlags(args);
  const message = positional[0];

  if (!message) {
    process.stderr.write(
      'Usage: cdk sign message <text> [--space espace|core] [--keystore <path>] [--json]\n',
    );
    process.stderr.write(
      'Credentials: set CFX_KEYSTORE_PATH and CFX_PASSPHRASE environment variables.\n',
    );
    process.exitCode = 1;
    return;
  }

  let session: Awaited<ReturnType<typeof buildSession>>;
  try {
    session = await buildSession(flags);
  } catch (err) {
    process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
    process.exitCode = 1;
    return;
  }

  try {
    const signer = flags.space === 'core' ? session.core : session.eSpace;
    if (!signer) {
      process.stderr.write(`Core Space signer not available for backend '${session.kind}'.\n`);
      process.exitCode = 1;
      return;
    }
    const signature = await signer.signMessage(message);
    if (flags.json) {
      process.stdout.write(
        `${JSON.stringify({ message, space: flags.space, signer: signer.account.address, signature }, null, 2)}\n`,
      );
    } else {
      process.stdout.write(`${signature}\n`);
    }
  } finally {
    await session.dispose();
  }
}

async function runSignTypedData(args: readonly string[]): Promise<void> {
  const { readFile } = await import('node:fs/promises');
  const { positional, flags } = parseSignFlags(args);
  const jsonFile = positional[0];

  if (!jsonFile) {
    process.stderr.write('Usage: cdk sign typed-data <json-file> [--space espace|core] [--json]\n');
    process.exitCode = 1;
    return;
  }

  let typedData: unknown;
  try {
    typedData = JSON.parse(await readFile(jsonFile, 'utf8'));
  } catch {
    process.stderr.write(`Cannot read '${jsonFile}'.\n`);
    process.exitCode = 1;
    return;
  }

  let session: Awaited<ReturnType<typeof buildSession>>;
  try {
    session = await buildSession(flags);
  } catch (err) {
    process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
    process.exitCode = 1;
    return;
  }

  try {
    const signer = flags.space === 'core' ? session.core : session.eSpace;
    if (!signer) {
      process.stderr.write(`Core Space signer not available.\n`);
      process.exitCode = 1;
      return;
    }
    const signature = await signer.signTypedData(typedData as never);
    if (flags.json) {
      process.stdout.write(
        `${JSON.stringify({ file: jsonFile, space: flags.space, signer: signer.account.address, signature }, null, 2)}\n`,
      );
    } else {
      process.stdout.write(`${signature}\n`);
    }
  } finally {
    await session.dispose();
  }
}

function printSignHelp(): void {
  process.stdout.write(`cdk sign — headless signing from configured signer identity

Usage:
  cdk sign message <text>        [--space espace|core] [--keystore <path>] [--account <name>] [--json]
  cdk sign typed-data <json>     [--space espace|core] [--keystore <path>] [--json]

Credential resolution order:
  1. --keystore / --account flags
  2. CFX_KEYSTORE_PATH + CFX_PASSPHRASE env vars
  3. .cfxdevkit/signer.json (run 'cdk signer setup' to configure)

Env vars (file-keystore):
  CFX_KEYSTORE_PATH    Path to the encrypted keystore file
  CFX_PASSPHRASE       Decryption passphrase
  CFX_KEYSTORE_SERVICE ref.service  (default: cfxdevkit)
  CFX_KEYSTORE_ACCOUNT ref.account  (default: default)
  CFX_SIGNER_NAME      Active signer name in signer.json

Exit codes: 0 success, 1 error
`);
}
