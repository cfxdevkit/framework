/**
 * Keystore CLI command handlers.
 *
 * Extracted from keystore.ts to reduce file complexity.
 */

import { deriveDualAccount, generateMnemonic, validateMnemonic } from '@cfxdevkit/cdk/wallet';
import * as servicesMod from '@cfxdevkit/services';
import {
  createSignerSession,
  createSignerSessionFromConfig,
  readSignerConfig,
  resolveSignerEntry,
  type SignerConfig,
  type SignerSession,
  signerConfigPath,
  writeSignerConfig,
} from '@cfxdevkit/signer-session';
import { getBool, getString } from '../args.js';
import {
  buildSignerEntry,
  ensureFileKeystore,
  isSignerKind,
  parseMnemonicStrength,
  parseOptionalInt,
  positionalArgs,
  requireEnv,
  resolveMnemonicInput,
} from './keystore-helpers.js';

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

async function keystoreStatusFromFlags(
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

async function keystoreListFromFlags(
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

async function keystoreUseFromFlags(
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

async function keystoreSetFromFlags(
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

async function keystoreReadFromFlags(
  flags: Record<string, string | boolean>,
  stdout: NodeJS.WritableStream,
): Promise<number> {
  const cwd = getString(flags, 'cwd') ?? process.cwd();
  const selectedName = getString(flags, 'name');
  const directKeystore = getString(flags, 'keystore');
  const passphraseEnv = getString(flags, 'passphrase-env') ?? 'CFX_PASSPHRASE';
  const service = getString(flags, 'service');
  const account = getString(flags, 'account');
  const accountIndex = parseOptionalInt(getString(flags, 'account-index'));
  const json = getBool(flags, 'json');
  try {
    let session: SignerSession;
    if (directKeystore === undefined) {
      session = await createSignerSessionFromConfig(selectedName ?? null, cwd);
    } else {
      session = await createSignerSession({
        kind: 'file-keystore',
        path: directKeystore,
        passphrase: requireEnv(passphraseEnv),
        ...(service ? { service } : {}),
        ...(account ? { account } : {}),
        ...(accountIndex !== undefined ? { accountIndex } : {}),
      });
    }
    const payload = {
      kind: session.kind,
      label: session.label,
      eSpaceAddress: session.eSpace.account.address,
      coreAddress: session.core?.account.coreAddress ?? null,
    };
    if (json) {
      stdout.write(JSON.stringify(payload, null, 2) + '\n');
    } else {
      stdout.write(`kind: ${payload.kind}\n`);
      stdout.write(`label: ${payload.label}\n`);
      stdout.write(`espace: ${payload.eSpaceAddress}\n`);
      if (payload.coreAddress) stdout.write(`core: ${payload.coreAddress}\n`);
    }
    await session.dispose();
    return 0;
  } catch (error) {
    stdout.write(`cfx keystore: ${error instanceof Error ? error.message : String(error)}\n`);
    return 1;
  }
}

async function keystorePingFromFlags(
  flags: Record<string, string | boolean>,
  stdout: NodeJS.WritableStream,
): Promise<number> {
  const cwd = getString(flags, 'cwd') ?? process.cwd();
  const selectedName = getString(flags, 'name');
  const message = getString(flags, 'message') ?? `cfxdevkit:ping:${new Date().toISOString()}`;
  const json = getBool(flags, 'json');
  try {
    const session = await createSignerSessionFromConfig(selectedName ?? null, cwd, {
      oneKeyIncludeCore: false,
    });
    const signature = await session.eSpace.signMessage(message);
    const payload = {
      reachable: true,
      kind: session.kind,
      label: session.label,
      message,
      signature,
      eSpaceAddress: session.eSpace.account.address,
      coreAddress: session.core?.account.coreAddress ?? null,
    };
    if (json) {
      stdout.write(JSON.stringify(payload, null, 2) + '\n');
    } else {
      stdout.write(`reachable: yes (${payload.kind})\n`);
      stdout.write(`label: ${payload.label}\n`);
      stdout.write(`espace: ${payload.eSpaceAddress}\n`);
      if (payload.coreAddress) stdout.write(`core: ${payload.coreAddress}\n`);
      stdout.write(`signature: ${payload.signature}\n`);
    }
    await session.dispose();
    return 0;
  } catch (error) {
    stdout.write(`cfx keystore: ${error instanceof Error ? error.message : String(error)}\n`);
    return 1;
  }
}

async function keystoreMnemonicFromFlags(
  flags: Record<string, string | boolean>,
  stdout: NodeJS.WritableStream,
): Promise<number> {
  const subaction = flags._1;
  if (!subaction || subaction === 'help') {
    stdout.write('Usage: cfx keystore mnemonic <generate|validate|derive|add> [flags]\n\n');
    stdout.write('  generate [--strength 128|160|192|224|256] [--json]\n');
    stdout.write('  validate [--mnemonic <phrase>] [--mnemonic-env <env>] [--json]\n');
    stdout.write(
      '  derive [--mnemonic <phrase>] [--mnemonic-env <env>] [--index <n>] [--account-type <standard|mining>] [--core-network-id <id>] [--passphrase-env <env>] [--show-private-key] [--json]\n',
    );
    stdout.write(
      '  add --name <signer> [--mnemonic <phrase>|--mnemonic-env <env>] [--keystore <path>] [--passphrase-env <env>] [--service <name>] [--account <name>] [--account-index <n>] [--default] [--cwd <dir>] [--json]\n',
    );
    return 1;
  }
  const json = getBool(flags, 'json');

  try {
    if (subaction === 'generate') {
      const strength = parseMnemonicStrength(getString(flags, 'strength'));
      const mnemonic = generateMnemonic(strength);
      if (json) {
        stdout.write(JSON.stringify({ mnemonic, strength }, null, 2) + '\n');
      } else {
        stdout.write(mnemonic + '\n');
      }
      return 0;
    }

    if (subaction === 'validate') {
      const mnemonic = resolveMnemonicInput(flags);
      const valid = validateMnemonic(mnemonic);
      if (json) {
        stdout.write(JSON.stringify({ valid }, null, 2) + '\n');
      } else {
        stdout.write(valid ? 'valid\n' : 'invalid\n');
      }
      return valid ? 0 : 1;
    }

    if (subaction === 'derive') {
      const mnemonic = resolveMnemonicInput(flags);
      const accountType = parseAccountType(getString(flags, 'account-type'));
      const index = parseOptionalInt(getString(flags, 'index')) ?? 0;
      const coreNetworkId = parseOptionalInt(getString(flags, 'core-network-id')) ?? 1029;
      const passphraseEnv = getString(flags, 'passphrase-env');
      const showPrivateKey = getBool(flags, 'show-private-key');

      const report = deriveDualAccount({
        mnemonic,
        index,
        accountType,
        coreNetworkId,
        ...(passphraseEnv ? { passphrase: requireEnv(passphraseEnv) } : {}),
      });
      const payload = {
        index: report.index,
        accountType,
        evmAddress: report.evmAddress,
        coreAddress: report.coreAddress,
        paths: report.paths,
        ...(showPrivateKey ? { privateKey: report.privateKey } : {}),
      };
      if (json) {
        stdout.write(JSON.stringify(payload, null, 2) + '\n');
      } else {
        stdout.write(`evm: ${payload.evmAddress}\n`);
        stdout.write(`core: ${payload.coreAddress}\n`);
        stdout.write(`path(evm): ${payload.paths.evm}\n`);
        stdout.write(`path(core): ${payload.paths.core}\n`);
        if (showPrivateKey) stdout.write(`privateKey: ${report.privateKey}\n`);
      }
      return 0;
    }

    if (subaction === 'add') {
      return keystoreMnemonicAddFromFlags(flags, stdout);
    }
  } catch (error) {
    stdout.write(`cfx keystore: ${error instanceof Error ? error.message : String(error)}\n`);
    return 1;
  }

  stdout.write(`Unknown mnemonic action: ${subaction}\n`);
  return 1;
}

function parseAccountType(value: string | undefined): 'standard' | 'mining' {
  if (!value || value === 'standard') return 'standard';
  if (value === 'mining') return 'mining';
  throw new Error(`Invalid --account-type value: ${value}`);
}

async function keystoreMnemonicAddFromFlags(
  flags: Record<string, string | boolean>,
  stdout: NodeJS.WritableStream,
): Promise<number> {
  const signerName = getString(flags, 'name') ?? positionalArgs(flags)[0];
  const cwd = getString(flags, 'cwd') ?? process.cwd();
  const json = getBool(flags, 'json');
  const makeDefault = getBool(flags, 'default');
  if (!signerName) {
    stdout.write('Usage: cfx keystore mnemonic add --name <signer> [...]\n');
    return 1;
  }

  const service = getString(flags, 'service') ?? 'cfxdevkit';
  const account = getString(flags, 'account') ?? signerName;
  const accountIndex = parseOptionalInt(getString(flags, 'account-index')) ?? 0;
  const keystorePath =
    getString(flags, 'keystore') ??
    process.env.CFX_KEYSTORE_PATH ??
    join(cwd, '.cfxdevkit', 'keystore.json');
  const passphraseEnv = getString(flags, 'passphrase-env') ?? 'CFX_PASSPHRASE';
  const passphrase = requireEnv(passphraseEnv);
  const mnemonicFlag = getString(flags, 'mnemonic');
  const mnemonicEnv = getString(flags, 'mnemonic-env');
  const mnemonic = mnemonicFlag ?? (mnemonicEnv ? requireEnv(mnemonicEnv) : undefined);

  await ensureFileKeystore(keystorePath, passphrase);
  const createFileKeystore = (servicesMod as Record<string, unknown>).createFileKeystore as (opts: {
    path: string;
    unlock: () => Promise<{ passphrase: string }>;
  }) => {
    put?: (input: {
      ref: { service: string; account: number | string };
      kind: string;
      secret: string;
    }) => Promise<void>;
    has?: (input: { service: string; account: number | string }) => Promise<boolean>;
  };
  const provider = createFileKeystore({ path: keystorePath, unlock: async () => ({ passphrase }) });

  if (mnemonic !== undefined) {
    if (!validateMnemonic(mnemonic)) throw new Error('Provided mnemonic is invalid.');
    await provider.put?.({ ref: { service, account }, kind: 'mnemonic', secret: mnemonic });
  } else {
    if (provider.has) {
      const exists = await provider.has({ service, account });
      if (!exists)
        throw new Error(
          `Mnemonic ref not found in keystore: ${service}/${account}. Provide --mnemonic or --mnemonic-env to add it.`,
        );
    } else {
      throw new Error(
        `Mnemonic ref not found in keystore: ${service}/${account}. Provide --mnemonic or --mnemonic-env to add it.`,
      );
    }
  }

  const config = await readSignerConfig(cwd);
  const entry = {
    kind: 'file-keystore' as const,
    path: keystorePath,
    service,
    account,
    accountIndex,
  };
  const next = {
    ...config,
    signers: { ...config.signers, [signerName]: entry },
    ...(makeDefault ? { defaultSigner: signerName } : {}),
  };
  await writeSignerConfig(next, cwd);

  const payload = {
    updated: true,
    signer: signerName,
    defaultSigner: next.defaultSigner,
    keystorePath,
    ref: `${service}/${account}`,
    accountIndex,
    mnemonicStored: mnemonic !== undefined,
  };
  if (json) {
    stdout.write(JSON.stringify(payload, null, 2) + '\n');
  } else {
    stdout.write(`mnemonic signer linked: ${signerName}\n`);
    stdout.write(`ref: ${payload.ref}\n`);
    stdout.write(`accountIndex: ${payload.accountIndex}\n`);
    if (makeDefault) stdout.write(`default signer set to ${signerName}\n`);
  }
  return 0;
}

import { join } from 'node:path';
