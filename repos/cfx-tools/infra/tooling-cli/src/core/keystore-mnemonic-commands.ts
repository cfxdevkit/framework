/**
 * Keystore mnemonic commands (generate, validate, derive, add).
 *
 * Extracted from keystore-commands.ts to reduce file size.
 */

import { constants as fsConstants } from 'node:fs';
import { access, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { deriveDualAccount, generateMnemonic, validateMnemonic } from '@cfxdevkit/cdk/wallet';
import { createFileKeystore, initFileKeystore } from '@cfxdevkit/services/keystore-file';
import type { SignerEntry } from '@cfxdevkit/signer-session';
import { readSignerConfig, writeSignerConfig } from '@cfxdevkit/signer-session';

export async function handleMnemonic(args: string[]): Promise<void> {
  const [action = 'help', ...actionArgs] = args;
  if (isHelpToken(action)) {
    console.log(
      'Usage: cdk keystore mnemonic <generate|validate|derive|add> [flags]\n' +
        '  generate [--strength 128|160|192|224|256] [--json]\n' +
        '  validate [--mnemonic <phrase>] [--mnemonic-env <env>] [--json]\n' +
        '  derive [--mnemonic <phrase>] [--mnemonic-env <env>] [--index <n>] [--account-type <standard|mining>] [--core-network-id <id>] [--passphrase-env <env>] [--show-private-key] [--json]\n' +
        '  add --name <signer> [--mnemonic <phrase>|--mnemonic-env <env>] [--keystore <path>] [--passphrase-env <env>] [--service <name>] [--account <name>] [--account-index <n>] [--default] [--cwd <dir>] [--json]',
    );
    return;
  }

  try {
    if (action === 'generate') {
      const strength = parseMnemonicStrength(getFlagValue(actionArgs, '--strength'));
      const json = actionArgs.includes('--json');
      const mnemonic = generateMnemonic(strength);
      if (json) console.log(JSON.stringify({ mnemonic, strength }, null, 2));
      else console.log(mnemonic);
      return;
    }

    if (action === 'validate') {
      const mnemonic = resolveMnemonicInput(actionArgs);
      const json = actionArgs.includes('--json');
      const valid = validateMnemonic(mnemonic);
      if (json) console.log(JSON.stringify({ valid }, null, 2));
      else console.log(valid ? 'valid' : 'invalid');
      if (!valid) process.exitCode = 1;
      return;
    }

    if (action === 'derive') {
      const mnemonic = resolveMnemonicInput(actionArgs);
      const accountType = parseAccountType(getFlagValue(actionArgs, '--account-type'));
      const index = parseOptionalInt(getFlagValue(actionArgs, '--index')) ?? 0;
      const coreNetworkId = parseOptionalInt(getFlagValue(actionArgs, '--core-network-id')) ?? 1029;
      const passphraseEnv = getFlagValue(actionArgs, '--passphrase-env');
      const showPrivateKey = actionArgs.includes('--show-private-key');
      const json = actionArgs.includes('--json');

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
      if (json) console.log(JSON.stringify(payload, null, 2));
      else {
        console.log(`evm: ${payload.evmAddress}`);
        console.log(`core: ${payload.coreAddress}`);
        console.log(`path(evm): ${payload.paths.evm}`);
        console.log(`path(core): ${payload.paths.core}`);
        if (showPrivateKey) console.log(`privateKey: ${report.privateKey}`);
      }
      return;
    }

    if (action === 'add') {
      await handleMnemonicAdd(actionArgs);
      return;
    }
  } catch (error) {
    console.error(toErrorMessage(error));
    process.exitCode = 1;
    return;
  }

  console.error(`Unknown mnemonic action: ${action}`);
  process.exitCode = 1;
}

async function handleMnemonicAdd(args: readonly string[]): Promise<void> {
  const signerName = getFlagValue(args, '--name') ?? positionalArgs(args)[0];
  const cwd = getFlagValue(args, '--cwd') ?? process.cwd();
  const json = args.includes('--json');
  const makeDefault = args.includes('--default');
  if (!signerName) {
    throw new Error(
      'Usage: cdk keystore mnemonic add --name <signer> [--mnemonic <phrase>|--mnemonic-env <env>] [--keystore <path>] [--passphrase-env <env>] [--service <name>] [--account <name>] [--account-index <n>] [--default] [--cwd <dir>] [--json]',
    );
  }

  const service = getFlagValue(args, '--service') ?? 'cfxdevkit';
  const account = getFlagValue(args, '--account') ?? signerName;
  const accountIndex = parseOptionalInt(getFlagValue(args, '--account-index')) ?? 0;
  const keystorePath =
    getFlagValue(args, '--keystore') ??
    process.env.CFX_KEYSTORE_PATH ??
    join(cwd, '.cfxdevkit', 'keystore.json');
  const passphraseEnv = getFlagValue(args, '--passphrase-env') ?? 'CFX_PASSPHRASE';
  const passphrase = requireEnv(passphraseEnv);
  const mnemonicFlag = getFlagValue(args, '--mnemonic');
  const mnemonicEnv = getFlagValue(args, '--mnemonic-env');
  const mnemonic = mnemonicFlag ?? (mnemonicEnv ? requireEnv(mnemonicEnv) : undefined);

  await ensureFileKeystore(keystorePath, passphrase);
  const provider = createFileKeystore({ path: keystorePath, unlock: async () => ({ passphrase }) });

  if (mnemonic !== undefined) {
    if (!validateMnemonic(mnemonic)) throw new Error('Provided mnemonic is invalid.');
    await provider.put?.({ ref: { service, account }, kind: 'mnemonic', secret: mnemonic });
  } else {
    const exists = await provider.has({ service, account });
    if (!exists)
      throw new Error(
        `Mnemonic ref not found in keystore: ${service}/${account}. Provide --mnemonic or --mnemonic-env to add it.`,
      );
  }

  const config = await readSignerConfig(cwd);
  const entry: SignerEntry = {
    kind: 'file-keystore',
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
  if (json) console.log(JSON.stringify(payload, null, 2));
  else {
    console.log(`mnemonic signer linked: ${signerName}`);
    console.log(`ref: ${payload.ref}`);
    console.log(`accountIndex: ${accountIndex}`);
    if (makeDefault) console.log(`default signer set to ${signerName}`);
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function ensureFileKeystore(path: string, passphrase: string): Promise<void> {
  try {
    await access(path, fsConstants.F_OK);
    return;
  } catch {
    await mkdir(dirname(path), { recursive: true });
    await initFileKeystore({ path, passphrase });
  }
}

function parseOptionalInt(value: string | undefined): number | undefined {
  if (value === undefined) return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) throw new Error(`Expected integer value, got: ${value}`);
  return parsed;
}

function getFlagValue(args: readonly string[], flag: string): string | undefined {
  const index = args.indexOf(flag);
  if (index < 0) return undefined;
  return args[index + 1];
}

function resolveMnemonicInput(args: readonly string[]): string {
  const inline = getFlagValue(args, '--mnemonic');
  if (inline) return inline;
  const envName = getFlagValue(args, '--mnemonic-env') ?? 'CFX_MNEMONIC';
  return requireEnv(envName);
}

function parseMnemonicStrength(value: string | undefined): 128 | 160 | 192 | 224 | 256 {
  if (!value) return 128;
  const parsed = Number(value);
  if (parsed === 128 || parsed === 160 || parsed === 192 || parsed === 224 || parsed === 256)
    return parsed;
  throw new Error(`Invalid --strength value: ${value}`);
}

function parseAccountType(value: string | undefined): 'standard' | 'mining' {
  if (!value || value === 'standard') return 'standard';
  if (value === 'mining') return 'mining';
  throw new Error(`Invalid --account-type value: ${value}`);
}

function positionalArgs(args: readonly string[]): string[] {
  const argsWithValues = new Set([
    '--cwd',
    '--name',
    '--keystore',
    '--passphrase-env',
    '--mnemonic',
    '--mnemonic-env',
    '--service',
    '--account',
    '--account-index',
  ]);
  return args.filter((arg, index) => {
    const previous = args[index - 1];
    if (arg.startsWith('--')) return false;
    if (previous && argsWithValues.has(previous)) return false;
    return true;
  });
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function isHelpToken(value: string): boolean {
  return value === 'help' || value === '--help' || value === '-h';
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
