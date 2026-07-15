/**
 * Keystore mnemonic commands — generate, validate, derive, add.
 *
 * BIP-39 mnemonic operations and file-keystore integration.
 */

import { join } from 'node:path';
import { deriveDualAccount, generateMnemonic, validateMnemonic } from '@cfxdevkit/cdk/wallet';
import * as servicesMod from '@cfxdevkit/services';
import { readSignerConfig, writeSignerConfig } from '@cfxdevkit/signer-session';
import { getBool, getString } from '../args.js';
import {
  ensureFileKeystore,
  parseMnemonicStrength,
  parseOptionalInt,
  positionalArgs,
  requireEnv,
  resolveMnemonicInput,
} from './keystore-helpers.js';

function parseAccountType(value: string | undefined): 'standard' | 'mining' {
  if (!value || value === 'standard') return 'standard';
  if (value === 'mining') return 'mining';
  throw new Error(`Invalid --account-type value: ${value}`);
}

export async function keystoreMnemonicFromFlags(
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

export async function keystoreMnemonicAddFromFlags(
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
  const provider = createFileKeystore({
    path: keystorePath,
    unlock: async () => ({ passphrase }),
  });

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
