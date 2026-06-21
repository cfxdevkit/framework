/**
 * Keystore configuration commands (status, list, use, set).
 *
 * Extracted from keystore-commands.ts to reduce file size.
 */

import type { SignerEntry, SignerKind } from '@cfxdevkit/signer-session';
import {
  readSignerConfig,
  resolveSignerEntry,
  signerConfigPath,
  writeSignerConfig,
} from '@cfxdevkit/signer-session';

export async function handleStatus(args: string[], json: boolean): Promise<void> {
  const cwd = getFlagValue(args, '--cwd') ?? process.cwd();
  const selectedName = getFlagValue(args, '--name');
  const config = await readSignerConfig(cwd);
  const resolved = resolveSignerEntry(config, selectedName ?? null);
  const info = {
    configPath: signerConfigPath(cwd),
    defaultSigner: config.defaultSigner,
    selectedSigner: resolved.name,
    kind: resolved.entry.kind,
    keystorePath:
      resolved.entry.kind === 'file-keystore'
        ? (resolved.entry.path ?? process.env.CFX_KEYSTORE_PATH ?? null)
        : null,
  } as const;
  if (json) {
    console.log(JSON.stringify(info, null, 2));
  } else {
    console.log(`config: ${info.configPath}`);
    console.log(`default: ${info.defaultSigner}`);
    console.log(`active: ${info.selectedSigner} (${info.kind})`);
    if (info.keystorePath) {
      console.log(`keystore: ${info.keystorePath}`);
    }
  }
}

export async function handleList(args: string[], json: boolean): Promise<void> {
  const cwd = getFlagValue(args, '--cwd') ?? process.cwd();
  const config = await readSignerConfig(cwd);
  const items = Object.entries(config.signers).map(([name, entry]) => ({
    name,
    kind: entry.kind,
    isDefault: name === config.defaultSigner,
  }));
  if (json) {
    console.log(JSON.stringify({ configPath: signerConfigPath(cwd), signers: items }, null, 2));
  } else {
    for (const item of items) {
      console.log(`${item.isDefault ? '*' : ' '} ${item.name.padEnd(20)} ${item.kind}`);
    }
  }
}

export async function handleUse(args: string[], json: boolean): Promise<void> {
  const [name] = positionalArgs(args);
  const cwd = getFlagValue(args, '--cwd') ?? process.cwd();
  if (!name) {
    console.error('Usage: cdk keystore use <name> [--cwd <dir>] [--json]');
    process.exitCode = 1;
    return;
  }
  const config = await readSignerConfig(cwd);
  if (!config.signers[name]) {
    console.error(`Unknown signer: ${name}`);
    process.exitCode = 1;
    return;
  }
  const next = { ...config, defaultSigner: name };
  await writeSignerConfig(next, cwd);
  if (json) {
    console.log(JSON.stringify({ updated: true, defaultSigner: name }, null, 2));
  } else {
    console.log(`default signer set to ${name}`);
  }
}

export async function handleSet(args: string[], json: boolean): Promise<void> {
  const [name] = positionalArgs(args);
  const cwd = getFlagValue(args, '--cwd') ?? process.cwd();
  const kindRaw = getFlagValue(args, '--kind');
  const makeDefault = args.includes('--default');
  if (!name || !kindRaw || !isSignerKind(kindRaw)) {
    console.error(
      'Usage: cdk keystore set <name> --kind <memory|file-keystore|onekey|ledger> [flags]',
    );
    process.exitCode = 1;
    return;
  }

  const config = await readSignerConfig(cwd);
  const nextEntry = buildSignerEntry(kindRaw, args);
  const next = {
    ...config,
    signers: {
      ...config.signers,
      [name]: nextEntry,
    },
    ...(makeDefault ? { defaultSigner: name } : {}),
  };
  await writeSignerConfig(next, cwd);

  if (json) {
    console.log(
      JSON.stringify(
        { updated: true, name, entry: nextEntry, defaultSigner: next.defaultSigner },
        null,
        2,
      ),
    );
  } else {
    console.log(`saved signer ${name} (${nextEntry.kind})`);
    if (makeDefault) {
      console.log(`default signer set to ${name}`);
    }
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildSignerEntry(kind: SignerKind, args: readonly string[]): SignerEntry {
  switch (kind) {
    case 'memory':
      return { kind: 'memory' };
    case 'file-keystore': {
      const path = getFlagValue(args, '--path');
      const service = getFlagValue(args, '--service');
      const account = getFlagValue(args, '--account');
      const accountIndex = parseOptionalInt(getFlagValue(args, '--account-index'));
      const espaceChainId = parseOptionalInt(getFlagValue(args, '--espace-chain-id'));
      const coreNetworkId = parseOptionalInt(getFlagValue(args, '--core-network-id'));

      return {
        kind,
        ...(path !== undefined ? { path } : {}),
        ...(service !== undefined ? { service } : {}),
        ...(account !== undefined ? { account } : {}),
        ...(accountIndex !== undefined ? { accountIndex } : {}),
        ...(espaceChainId !== undefined ? { espaceChainId } : {}),
        ...(coreNetworkId !== undefined ? { coreNetworkId } : {}),
      };
    }
    case 'onekey': {
      const espacePath = getFlagValue(args, '--espace-path');
      const corePath = getFlagValue(args, '--core-path');
      const espaceChainId = parseOptionalInt(getFlagValue(args, '--espace-chain-id'));
      const coreNetworkId = parseOptionalInt(getFlagValue(args, '--core-network-id'));

      return {
        kind,
        ...(espacePath !== undefined ? { espacePath } : {}),
        ...(corePath !== undefined ? { corePath } : {}),
        ...(espaceChainId !== undefined ? { espaceChainId } : {}),
        ...(coreNetworkId !== undefined ? { coreNetworkId } : {}),
      };
    }
    case 'ledger': {
      const espaceChainId = parseOptionalInt(getFlagValue(args, '--espace-chain-id'));
      const coreNetworkId = parseOptionalInt(getFlagValue(args, '--core-network-id'));

      return {
        kind,
        ...(espaceChainId !== undefined ? { espaceChainId } : {}),
        ...(coreNetworkId !== undefined ? { coreNetworkId } : {}),
      };
    }
  }
}

function positionalArgs(args: readonly string[]): string[] {
  const argsWithValues = new Set([
    '--cwd',
    '--name',
    '--message',
    '--kind',
    '--path',
    '--service',
    '--account',
    '--account-index',
    '--espace-chain-id',
    '--core-network-id',
    '--espace-path',
    '--core-path',
    '--file',
    '--chain',
    '--rpc-url',
    '--keystore',
    '--passphrase-env',
    '--strength',
    '--mnemonic',
    '--mnemonic-env',
    '--account-type',
    '--index',
  ]);
  return args.filter((arg, index) => {
    const previous = args[index - 1];
    if (arg.startsWith('--')) return false;
    if (previous && argsWithValues.has(previous)) return false;
    return true;
  });
}

function parseOptionalInt(value: string | undefined): number | undefined {
  if (value === undefined) return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) {
    throw new Error(`Expected integer value, got: ${value}`);
  }
  return parsed;
}

function getFlagValue(args: readonly string[], flag: string): string | undefined {
  const index = args.indexOf(flag);
  if (index < 0) return undefined;
  return args[index + 1];
}

function isSignerKind(value: string): value is SignerKind {
  return (
    value === 'memory' || value === 'file-keystore' || value === 'onekey' || value === 'ledger'
  );
}
