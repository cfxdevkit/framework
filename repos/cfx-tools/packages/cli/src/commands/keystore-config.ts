/**
 * Keystore config commands — status, list, use, set.
 *
 * Manages signer configuration (.cfxdevkit/signer.json).
 */

import {
  readSignerConfig,
  resolveSignerEntry,
  type SignerConfig,
  signerConfigPath,
  writeSignerConfig,
} from '@cfxdevkit/signer-session';
import { getBool, getString } from '../args.js';
import { buildSignerEntry, isSignerKind, positionalArgs } from './keystore-helpers.js';

export async function keystoreStatusFromFlags(
  flags: Record<string, string | boolean>,
  stdout: NodeJS.WritableStream,
): Promise<number> {
  const cwd = getString(flags, 'cwd') ?? process.cwd();
  const selectedName = getString(flags, 'name');
  const json = getBool(flags, 'json');
  try {
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
      stdout.write(JSON.stringify(info, null, 2) + '\n');
    } else {
      stdout.write(`config: ${info.configPath}\n`);
      stdout.write(`default: ${info.defaultSigner}\n`);
      stdout.write(`active: ${info.selectedSigner} (${info.kind})\n`);
      if (info.keystorePath) {
        stdout.write(`keystore: ${info.keystorePath}\n`);
      }
    }
    return 0;
  } catch (error) {
    stdout.write(`cfx keystore: ${error instanceof Error ? error.message : String(error)}\n`);
    return 1;
  }
}

export async function keystoreListFromFlags(
  flags: Record<string, string | boolean>,
  stdout: NodeJS.WritableStream,
): Promise<number> {
  const cwd = getString(flags, 'cwd') ?? process.cwd();
  const json = getBool(flags, 'json');
  try {
    const config = await readSignerConfig(cwd);
    const items = Object.entries(config.signers).map(([name, entry]) => ({
      name,
      kind: (entry as { kind: 'memory' | 'file-keystore' | 'onekey' | 'ledger' }).kind,
      isDefault: name === config.defaultSigner,
    }));
    if (json) {
      stdout.write(
        JSON.stringify({ configPath: signerConfigPath(cwd), signers: items }, null, 2) + '\n',
      );
    } else {
      for (const item of items) {
        stdout.write(`${item.isDefault ? '*' : ' '} ${item.name.padEnd(20)} ${item.kind}\n`);
      }
    }
    return 0;
  } catch (error) {
    stdout.write(`cfx keystore: ${error instanceof Error ? error.message : String(error)}\n`);
    return 1;
  }
}

export async function keystoreUseFromFlags(
  flags: Record<string, string | boolean>,
  stdout: NodeJS.WritableStream,
): Promise<number> {
  const [name] = positionalArgs(flags);
  const cwd = getString(flags, 'cwd') ?? process.cwd();
  const json = getBool(flags, 'json');
  if (!name) {
    stdout.write('Usage: cfx keystore use <name> [--cwd <dir>] [--json]\n');
    return 1;
  }
  try {
    const config = await readSignerConfig(cwd);
    if (!config.signers[name]) {
      stdout.write(`Unknown signer: ${name}\n`);
      return 1;
    }
    const next = { ...config, defaultSigner: name };
    await writeSignerConfig(next, cwd);
    if (json) {
      stdout.write(JSON.stringify({ updated: true, defaultSigner: name }, null, 2) + '\n');
    } else {
      stdout.write(`default signer set to ${name}\n`);
    }
    return 0;
  } catch (error) {
    stdout.write(`cfx keystore: ${error instanceof Error ? error.message : String(error)}\n`);
    return 1;
  }
}

export async function keystoreSetFromFlags(
  flags: Record<string, string | boolean>,
  stdout: NodeJS.WritableStream,
): Promise<number> {
  const [name] = positionalArgs(flags);
  const cwd = getString(flags, 'cwd') ?? process.cwd();
  const kindRaw = getString(flags, 'kind');
  const makeDefault = getBool(flags, 'default');
  const json = getBool(flags, 'json');
  if (!name || !kindRaw || !isSignerKind(kindRaw)) {
    stdout.write(
      'Usage: cfx keystore set <name> --kind <memory|file-keystore|onekey|ledger> [flags]\n',
    );
    return 1;
  }
  try {
    const config = await readSignerConfig(cwd);
    const nextEntry = buildSignerEntry(kindRaw, flags);
    const signers = { ...config.signers, [name]: nextEntry } as Record<string, typeof nextEntry>;
    const next: SignerConfig = {
      ...config,
      signers: signers as unknown as Record<string, SignerConfig['signers'][string]>,
      ...(makeDefault ? { defaultSigner: name } : {}),
    };
    await writeSignerConfig(next, cwd);
    if (json) {
      stdout.write(
        JSON.stringify(
          { updated: true, name, entry: nextEntry, defaultSigner: next.defaultSigner },
          null,
          2,
        ) + '\n',
      );
    } else {
      stdout.write(`saved signer ${name} (${nextEntry.kind})\n`);
      if (makeDefault) {
        stdout.write(`default signer set to ${name}\n`);
      }
    }
    return 0;
  } catch (error) {
    stdout.write(`cfx keystore: ${error instanceof Error ? error.message : String(error)}\n`);
    return 1;
  }
}
