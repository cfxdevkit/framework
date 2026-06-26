/**
 * Keystore helper utilities.
 *
 * Extracted from keystore.ts to reduce file complexity.
 */

import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

export function parseOptionalInt(value: string | undefined): number | undefined {
  if (value === undefined) return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) throw new Error(`Expected integer value, got: ${value}`);
  return parsed;
}

export function positionalArgs(flags: Record<string, string | boolean>): string[] {
  const argsWithValues = new Set([
    'cwd',
    'name',
    'keystore',
    'passphrase-env',
    'mnemonic',
    'mnemonic-env',
    'service',
    'account',
    'account-index',
    'to',
    'network-id',
    'kind',
    'path',
    'file',
    'chain',
    'rpc-url',
    'strength',
    'index',
    'account-type',
  ]);
  const positionals = Object.entries(flags)
    .filter(([k]) => k.startsWith('_') && !argsWithValues.has(k))
    .map(([, v]) => v as string);
  return positionals;
}

export function resolveMnemonicInput(flags: Record<string, string | boolean>): string {
  const inline = getString(flags, 'mnemonic');
  if (inline) return inline;
  const envName = getString(flags, 'mnemonic-env') ?? 'CFX_MNEMONIC';
  return requireEnv(envName);
}

function getString(flags: Record<string, string | boolean>, key: string): string | undefined {
  const val = flags[key];
  return typeof val === 'string' ? val : undefined;
}

export function parseMnemonicStrength(value: string | undefined): 128 | 160 | 192 | 224 | 256 {
  if (!value) return 128;
  const parsed = Number(value);
  if (parsed === 128 || parsed === 160 || parsed === 192 || parsed === 224 || parsed === 256)
    return parsed as 128 | 160 | 192 | 224 | 256;
  throw new Error(`Invalid --strength value: ${value}`);
}

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export function isSignerKind(
  value: string,
): value is 'memory' | 'file-keystore' | 'onekey' | 'ledger' {
  return (
    value === 'memory' || value === 'file-keystore' || value === 'onekey' || value === 'ledger'
  );
}

export function buildSignerEntry(
  kind: 'memory' | 'file-keystore' | 'onekey' | 'ledger',
  flags: Record<string, string | boolean>,
) {
  switch (kind) {
    case 'memory':
      return { kind: 'memory' as const };
    case 'file-keystore': {
      const path = getString(flags, 'path');
      const service = getString(flags, 'service');
      const account = getString(flags, 'account');
      const accountIndex = parseOptionalInt(getString(flags, 'account-index'));
      const espaceChainId = parseOptionalInt(getString(flags, 'espace-chain-id'));
      const coreNetworkId = parseOptionalInt(getString(flags, 'core-network-id'));
      const entry: Record<string, unknown> = { kind: 'file-keystore' as const };
      if (path !== undefined) entry.path = path;
      if (service !== undefined) entry.service = service;
      if (account !== undefined) entry.account = account;
      if (accountIndex !== undefined) entry.accountIndex = accountIndex;
      if (espaceChainId !== undefined) entry.espaceChainId = espaceChainId;
      if (coreNetworkId !== undefined) entry.coreNetworkId = coreNetworkId;
      return entry;
    }
    case 'onekey': {
      const espacePath = getString(flags, 'espace-path');
      const corePath = getString(flags, 'core-path');
      const espaceChainId = parseOptionalInt(getString(flags, 'espace-chain-id'));
      const coreNetworkId = parseOptionalInt(getString(flags, 'core-network-id'));
      const entry: Record<string, unknown> = { kind: 'onekey' as const };
      if (espacePath !== undefined) entry.espacePath = espacePath;
      if (corePath !== undefined) entry.corePath = corePath;
      if (espaceChainId !== undefined) entry.espaceChainId = espaceChainId;
      if (coreNetworkId !== undefined) entry.coreNetworkId = coreNetworkId;
      return entry;
    }
    case 'ledger': {
      const entry: Record<string, unknown> = { kind: 'ledger' as const };
      const espaceChainId = parseOptionalInt(getString(flags, 'espace-chain-id'));
      const coreNetworkId = parseOptionalInt(getString(flags, 'core-network-id'));
      if (espaceChainId !== undefined) entry.espaceChainId = espaceChainId;
      if (coreNetworkId !== undefined) entry.coreNetworkId = coreNetworkId;
      return entry;
    }
  }
}

export async function ensureFileKeystore(path: string, passphrase: string): Promise<void> {
  try {
    const { access } = await import('node:fs/promises');
    await access(path);
    return;
  } catch {
    await mkdir(dirname(path), { recursive: true });
    const servicesMod = await import('@cfxdevkit/services');
    const initFileKeystore = (servicesMod as Record<string, unknown>).initFileKeystore as (input: {
      path: string;
      passphrase: string;
    }) => Promise<void>;
    await initFileKeystore({ path, passphrase });
  }
}
