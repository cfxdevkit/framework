import { HDKey } from '@scure/bip32';
import {
  mnemonicToSeedSync,
  generateMnemonic as scureGenerateMnemonic,
  validateMnemonic as scureValidateMnemonic,
} from '@scure/bip39';
import { wordlist as english } from '@scure/bip39/wordlists/english.js';
import { privateKeyToAccount as civePrivateKeyToAccount } from 'cive/accounts';
import { privateKeyToAccount as viemPrivateKeyToAccount } from 'viem/accounts';
import { WalletError } from '../errors/index.js';
import type { Hex } from '../types/index.js';

export type ViemAccount = ReturnType<typeof viemPrivateKeyToAccount>;
export type CiveAccount = ReturnType<typeof civePrivateKeyToAccount>;
export type AnyAccount = ViemAccount | CiveAccount;

export const DEFAULT_CORE_PATH = "m/44'/503'/0'/0/0" as const;
export const DEFAULT_ESPACE_PATH = "m/44'/60'/0'/0/0" as const;

const CORE_PATH_PREFIX = "m/44'/503'";

// ── Public API ──────────────────────────────────────────────────────────────

export function generateMnemonic(strength: 128 | 160 | 192 | 224 | 256 = 128): string {
  return scureGenerateMnemonic(english, strength);
}

export function validateMnemonic(mnemonic: string): boolean {
  return scureValidateMnemonic(mnemonic.trim(), english);
}

// ── Account derivation (path-aware, returns full viem/cive account) ────────

/**
 * Derive a full signing-capable account from a private key.
 *
 * Selects the client based on path:
 *   - `m/44'/60'/...` → viem → hex address
 *   - `m/44'/503'/...` → cive → base32 address (coreNetworkId REQUIRED)
 *
 * Accepts path-based or family-based input. Throws if both are given and
 * they disagree.
 */
export interface AccountFromPrivateKeyInput {
  /** HD derivation path (e.g. "m/44'/60'/0'/0/0"). */
  path?: string;
  /** Chain family. Overrides path-derived family if both are given. */
  family?: 'espace' | 'core';
  /** Core network ID — required when family/path is 'core'. */
  coreNetworkId?: number;
}

/**
 * Derive a full signing-capable account from a private key.
 *
 * Selects the client based on path:
 *   - `m/44'/60'/...` → viem → hex address
 *   - `m/44'/503'/...` → cive → base32 address (coreNetworkId REQUIRED)
 *
 * Accepts path-based or family-based input. Throws if both are given and
 * they disagree.
 */
export function accountFromPrivateKey(
  privateKey: Hex,
  input?: AccountFromPrivateKeyInput,
): AnyAccount {
  const { path, family, coreNetworkId } = input ?? {};

  // Resolve family from path if not explicitly given
  const derivedFamily = path ? (path.startsWith(CORE_PATH_PREFIX) ? 'core' : 'espace') : undefined;

  // Check consistency if both are given
  if (path && family) {
    const pathFamily = path.startsWith(CORE_PATH_PREFIX) ? 'core' : 'espace';
    if (pathFamily !== family) {
      throw new WalletError({
        code: 'core/wallet/derivation',
        message: `family "${family}" does not match path prefix in "${path}"`,
        meta: { path, family },
      });
    }
  }

  // Determine final family
  const finalFamily = family ?? derivedFamily;
  if (!finalFamily) {
    throw new WalletError({
      code: 'core/wallet/derivation',
      message: 'Either "path" or "family" must be provided to determine the client.',
    });
  }

  if (finalFamily === 'core') {
    if (coreNetworkId === undefined) {
      throw new WalletError({
        code: 'core/wallet/derivation',
        message:
          'coreNetworkId is required when deriving a Core Space account. ' +
          'Pass coreNetworkId or a path starting with "m/44\'/503\'".',
      });
    }
    return civePrivateKeyToAccount(privateKey, { networkId: coreNetworkId });
  }

  // espace → viem
  return viemPrivateKeyToAccount(privateKey);
}

/**
 * Derive a full account from mnemonic + HD path.
 *
 * Path-aware: eSpace paths use viem (hex), Core paths use cive (base32).
 * coreNetworkId is required for Core paths.
 */
export interface DeriveAccountInput {
  mnemonic: string;
  path?: string;
  passphrase?: string;
  /**
   * Core network ID — required when path starts with `m/44'/503'/`.
   * Silently ignored for eSpace paths.
   */
  coreNetworkId?: number;
}

export interface DerivedAccount {
  /** Full signing-capable account (viem for eSpace, cive for Core). */
  account: AnyAccount;
}

export function deriveAccount(input: DeriveAccountInput): DerivedAccount {
  const { mnemonic, path = DEFAULT_CORE_PATH, passphrase, coreNetworkId } = input;
  if (!validateMnemonic(mnemonic))
    throw new WalletError({ code: 'core/wallet/derivation', message: 'Invalid BIP-39 mnemonic' });

  const child = HDKey.fromMasterSeed(mnemonicToSeedSync(mnemonic.trim(), passphrase ?? '')).derive(
    path,
  );
  if (!child.privateKey) {
    throw new WalletError({
      code: 'core/wallet/derivation',
      message: `Failed to derive private key at path ${path}`,
      meta: { path },
    });
  }
  const privateKey = `0x${bytesToHex(child.privateKey)}` as Hex;
  const isCore = path.startsWith(CORE_PATH_PREFIX);

  if (isCore && coreNetworkId === undefined) {
    throw new WalletError({
      code: 'core/wallet/derivation',
      message:
        "coreNetworkId is required for Core Space paths (m/44'/503'/...). " +
        'Pass coreNetworkId or use resolveNetworkIds("testnet") for testnet IDs.',
      meta: { path },
    });
  }

  const account = accountFromPrivateKey(privateKey, {
    path,
    ...(coreNetworkId !== undefined ? { coreNetworkId } : {}),
  });
  return { account };
}

// ── Batch derivation ────────────────────────────────────────────────────────

export interface DeriveAccountsInput {
  mnemonic: string;
  basePath?: string;
  count: number;
  passphrase?: string;
  /** Required when basePath derives Core Space paths. Ignored for eSpace. */
  coreNetworkId?: number;
}

export function deriveAccounts(input: DeriveAccountsInput): DerivedAccount[] {
  const { mnemonic, basePath = "m/44'/503'/0'/0", count, passphrase, coreNetworkId } = input;
  if (!Number.isInteger(count) || count <= 0) {
    throw new WalletError({
      code: 'core/wallet/derivation',
      message: 'count must be a positive integer',
      meta: { count },
    });
  }
  return Array.from({ length: count }, (_value, index) =>
    deriveAccount({
      mnemonic,
      path: `${basePath}/${index}`,
      ...(passphrase !== undefined ? { passphrase } : {}),
      ...(coreNetworkId !== undefined ? { coreNetworkId } : {}),
    }),
  );
}

// ── Dual-space derivation ───────────────────────────────────────────────────

export interface DeriveDualAccountInput {
  mnemonic: string;
  index?: number;
  accountType?: 'standard' | 'mining';
  /** Core network ID — required. Controls Core Space address encoding. */
  coreNetworkId?: number;
  passphrase?: string;
}

export interface DualAccount {
  /** eSpace account (viem, hex address). */
  evm: AnyAccount;
  /** Core Space account (cive, base32 address). */
  core: AnyAccount;
  index: number;
  paths: { evm: string; core: string };
}

export function deriveDualAccount(input: DeriveDualAccountInput): DualAccount {
  const { mnemonic, index = 0, accountType = 'standard', coreNetworkId, passphrase } = input;
  if (!Number.isInteger(index) || index < 0) {
    throw new WalletError({
      code: 'core/wallet/derivation',
      message: 'index must be a non-negative integer',
      meta: { index },
    });
  }
  if (coreNetworkId === undefined) {
    throw new WalletError({
      code: 'core/wallet/derivation',
      message: 'coreNetworkId is required for dual-space derivation',
    });
  }

  const accountSegment = accountType === 'standard' ? 0 : 1;
  const evmPath = `m/44'/60'/${accountSegment}'/0/${index}`;
  const corePath = `m/44'/503'/${accountSegment}'/0/${index}`;

  const evmPair = deriveKeyPair(mnemonic, evmPath, passphrase);
  const corePair = deriveKeyPair(mnemonic, corePath, passphrase);

  return {
    evm: accountFromPrivateKey(evmPair.privateKey, { path: evmPath }),
    core: accountFromPrivateKey(corePair.privateKey, { path: corePath, coreNetworkId }),
    index,
    paths: { evm: evmPath, core: corePath },
  };
}

export function deriveDualAccounts(
  input: DeriveDualAccountInput & { count: number; startIndex?: number },
): DualAccount[] {
  const { count, startIndex = 0, ...rest } = input;
  if (!Number.isInteger(count) || count <= 0) {
    throw new WalletError({
      code: 'core/wallet/derivation',
      message: 'count must be a positive integer',
      meta: { count },
    });
  }
  return Array.from({ length: count }, (_value, index) =>
    deriveDualAccount({ ...rest, index: startIndex + index }),
  );
}

// ── Internal helpers ────────────────────────────────────────────────────────

/** Derive a raw keypair from mnemonic + path. */
export function deriveKeyPair(
  mnemonic: string,
  path: string,
  passphrase?: string,
): { privateKey: Hex } {
  const child = HDKey.fromMasterSeed(mnemonicToSeedSync(mnemonic.trim(), passphrase ?? '')).derive(
    path,
  );
  if (!child.privateKey) {
    throw new WalletError({
      code: 'core/wallet/derivation',
      message: `Failed to derive private key at path ${path}`,
      meta: { path },
    });
  }
  const privateKey = `0x${bytesToHex(child.privateKey)}` as Hex;
  return { privateKey };
}

function bytesToHex(bytes: Uint8Array): string {
  let out = '';
  for (let index = 0; index < bytes.length; index++) {
    out += bytes[index]!.toString(16).padStart(2, '0');
  }
  return out;
}
