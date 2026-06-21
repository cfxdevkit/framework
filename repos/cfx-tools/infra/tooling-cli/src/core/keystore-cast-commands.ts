/**
 * Keystore cast commands (message, typed-data, tx).
 *
 * Extracted from keystore-signing-commands.ts to reduce file size.
 */

import { getChain } from '@cfxdevkit/cdk/chains';
import { createClient, http } from '@cfxdevkit/cdk/client';
import { createSignerSessionFromConfig } from '@cfxdevkit/signer-session';

export async function handleCast(args: string[]): Promise<void> {
  const [action = 'help', ...actionArgs] = args;
  if (isHelpToken(action)) {
    console.log(
      'Usage: cdk keystore cast <message|typed-data|tx> [flags]\n' +
        '  message <text> [--name <signer>] [--cwd <dir>] [--json]\n' +
        '  typed-data --file <path> [--name <signer>] [--cwd <dir>] [--json]\n' +
        '  tx --chain <id|name> --file <path> [--rpc-url <url>] [--name <signer>] [--cwd <dir>] [--dry-run] [--json]',
    );
    return;
  }

  if (action === 'message') {
    await handleCastMessage(actionArgs);
    return;
  }

  if (action === 'typed-data') {
    await handleCastTypedData(actionArgs);
    return;
  }

  if (action === 'tx') {
    await handleCastTx(actionArgs);
    return;
  }

  console.error(`Unknown cast action: ${action}`);
  process.exitCode = 1;
}

async function handleCastMessage(args: readonly string[]): Promise<void> {
  const [message] = positionalArgs(args);
  const cwd = getFlagValue(args, '--cwd') ?? process.cwd();
  const selectedName = getFlagValue(args, '--name');
  const json = args.includes('--json');
  if (!message) {
    console.error(
      'Usage: cdk keystore cast message <text> [--name <signer>] [--cwd <dir>] [--json]',
    );
    process.exitCode = 1;
    return;
  }
  try {
    const session = await createSignerSessionFromConfig(selectedName ?? null, cwd);
    const signature = await session.eSpace.signMessage(message);
    const payload = {
      action: 'message',
      signer: session.label,
      message,
      signature,
      address: session.eSpace.account.address,
    };
    if (json) console.log(JSON.stringify(payload, null, 2));
    else {
      console.log(`signature: ${payload.signature}`);
      console.log(`address: ${payload.address}`);
    }
    await session.dispose();
  } catch (error) {
    console.error(toErrorMessage(error));
    process.exitCode = 1;
  }
}

async function handleCastTypedData(args: readonly string[]): Promise<void> {
  const file = getFlagValue(args, '--file');
  const cwd = getFlagValue(args, '--cwd') ?? process.cwd();
  const selectedName = getFlagValue(args, '--name');
  const json = args.includes('--json');
  if (!file) {
    console.error(
      'Usage: cdk keystore cast typed-data --file <path> [--name <signer>] [--cwd <dir>] [--json]',
    );
    process.exitCode = 1;
    return;
  }
  try {
    const session = await createSignerSessionFromConfig(selectedName ?? null, cwd);
    const typedData = await readJsonFile(file);
    const signature = await session.eSpace.signTypedData(typedData as never);
    const payload = {
      action: 'typed-data',
      signer: session.label,
      signature,
      address: session.eSpace.account.address,
      sourceFile: file,
    };
    if (json) console.log(JSON.stringify(payload, null, 2));
    else {
      console.log(`signature: ${payload.signature}`);
      console.log(`address: ${payload.address}`);
    }
    await session.dispose();
  } catch (error) {
    console.error(toErrorMessage(error));
    process.exitCode = 1;
  }
}

async function handleCastTx(args: readonly string[]): Promise<void> {
  const file = getFlagValue(args, '--file');
  const chainTarget = getFlagValue(args, '--chain');
  const rpcUrl = getFlagValue(args, '--rpc-url');
  const cwd = getFlagValue(args, '--cwd') ?? process.cwd();
  const selectedName = getFlagValue(args, '--name');
  const dryRun = args.includes('--dry-run');
  const json = args.includes('--json');
  if (!file || !chainTarget) {
    console.error(
      'Usage: cdk keystore cast tx --chain <id|name> --file <path> [--rpc-url <url>] [--name <signer>] [--cwd <dir>] [--dry-run] [--json]',
    );
    process.exitCode = 1;
    return;
  }
  try {
    const chain = getChain(parseChainTarget(resolveChainAlias(chainTarget)));
    const txInput = await readJsonFile(file);
    const session = await createSignerSessionFromConfig(selectedName ?? null, cwd);
    const signer = chain.family === 'core' ? (session.core ?? session.eSpace) : session.eSpace;
    const signedTx = await signer.signTransaction({
      ...(txInput as Record<string, unknown>),
      family: chain.family,
      chainId: chain.id,
    } as never);

    if (dryRun) {
      const dryPayload = {
        action: 'tx',
        dryRun: true,
        signer: session.label,
        chain: chain.name,
        signedTx,
      };
      if (json) console.log(JSON.stringify(dryPayload, null, 2));
      else console.log(`signedTx: ${signedTx}`);
      await session.dispose();
      return;
    }

    const resolvedRpcUrl = rpcUrl ?? chain.rpc.http[0];
    const client = createClient({
      chain,
      transport: resolvedRpcUrl ? http({ url: resolvedRpcUrl }) : http(),
    });
    const hash = await client.sendRawTransaction(signedTx);
    const payload = {
      action: 'tx',
      dryRun: false,
      signer: session.label,
      chain: chain.name,
      rpcUrl: resolvedRpcUrl,
      txHash: hash,
    };
    if (json) console.log(JSON.stringify(payload, null, 2));
    else console.log(`txHash: ${hash}`);
    await session.dispose();
  } catch (error) {
    console.error(toErrorMessage(error));
    process.exitCode = 1;
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function readJsonFile(path: string): Promise<unknown> {
  const { readFile } = await import('node:fs/promises');
  const raw = await readFile(path, 'utf8');
  return JSON.parse(raw) as unknown;
}

function getFlagValue(args: readonly string[], flag: string): string | undefined {
  const index = args.indexOf(flag);
  if (index < 0) return undefined;
  return args[index + 1];
}

function resolveChainAlias(value: string): string {
  const aliases: Readonly<Record<string, string>> = {
    'conflux-espace-mainnet': 'espace-mainnet',
    'conflux-espace-testnet': 'espace-testnet',
    'conflux-espace-local': 'espace-local',
    'conflux-core-mainnet': 'core-mainnet',
    'conflux-core-testnet': 'core-testnet',
    'conflux-core-local': 'core-local',
  };
  return aliases[value] ?? value;
}

function parseChainTarget(value: string): number | string {
  const parsed = Number(value);
  if (Number.isInteger(parsed) && parsed > 0 && `${parsed}` === value) return parsed;
  return value;
}

function positionalArgs(args: readonly string[]): string[] {
  const argsWithValues = new Set(['--cwd', '--name', '--file', '--chain', '--rpc-url']);
  return args.filter((arg, index) => {
    const previous = args[index - 1];
    if (arg.startsWith('--')) return false;
    if (previous && argsWithValues.has(previous)) return false;
    return true;
  });
}

function isHelpToken(value: string): boolean {
  return value === 'help' || value === '--help' || value === '-h';
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
