/**
 * `@cfxdevkit/wallet/init` — turn-key wallet initializers.
 *
 * Production code typically wants one of:
 *
 * ```ts
 * // First boot — creates ~/.cfxdevkit/keystore.json (mode 0600), generates
 * // a fresh BIP-39 mnemonic, encrypts it, returns a ready Signer.
 * const w = await initLocalWallet({ passphrase, label: 'deployer' });
 * console.log(w.account.address, '— BACK UP MNEMONIC:', w.mnemonic);
 *
 * // Subsequent boots — opens the existing keystore, no mnemonic returned.
 * const w = await openLocalWallet({ passphrase, ref: { service: 'cfxdevkit', account: 'deployer' }});
 * ```
 *
 * The on-disk format is the `cfx-v1` envelope from
 * `@cfxdevkit/services/keystore-file` (Argon2id KEK + per-secret AES-256-GCM
 * with AAD). For multi-tenant or hardened deployments see the docker recipe
 * in `docs/keystore-docker.md`.
 */
import { homedir } from 'node:os';
import { join } from 'node:path';
import type { Signer } from '@cfxdevkit/core';
import { KeystoreError } from '@cfxdevkit/core';
import { deriveAccount, generateMnemonic } from '@cfxdevkit/core/wallet';
import type { Capability, KeystoreProvider, SecretRef } from '@cfxdevkit/services/keystore';
import {
  changeFilePassphrase,
  createFileKeystore,
  initFileKeystore,
  type KdfParams,
} from '@cfxdevkit/services/keystore-file';

const DEFAULT_SERVICE = 'cfxdevkit' as const;
const DEFAULT_ACCOUNT = 'default' as const;
const DEFAULT_PATH = "m/44'/60'/0'/0/0" as const;

/** Default keystore path: `$CFXDEVKIT_KEYSTORE` or `~/.cfxdevkit/keystore.json`. */
export function defaultKeystorePath(): string {
  return process.env.CFXDEVKIT_KEYSTORE ?? join(homedir(), '.cfxdevkit', 'keystore.json');
}

export interface InitLocalWalletInput {
  /** Passphrase used to derive the file-keystore KEK (Argon2id). Required. */
  passphrase: string;
  /** Override the default `~/.cfxdevkit/keystore.json` location. */
  path?: string;
  /** Label stored under the secret. Defaults to `"default"`. */
  label?: string;
  /** Custom logical service name. Defaults to `"cfxdevkit"`. */
  service?: string;
  /** BIP-44 path. Default `m/44'/60'/0'/0/0`. */
  derivationPath?: string;
  /** Optional capability to bind to the returned Signer. */
  capability?: Capability;
  /** Bring-your-own mnemonic (skips generation). 12/24-word BIP-39. */
  mnemonic?: string;
  /** Strength when generating a fresh mnemonic. Default 256 (24 words). */
  mnemonicStrength?: 128 | 160 | 192 | 224 | 256;
  /** Optional BIP-39 passphrase (the "25th word"). */
  bip39Passphrase?: string;
  /**
   * Override Argon2id KDF parameters used to encrypt the keystore.
   * **Leave unset in production.** For tests pass e.g. `{ memKiB: 64, iterations: 1 }`
   * to reduce key-derivation time from ~5 s to < 10 ms.
   */
  kdf?: KdfParams;
}

export interface InitLocalWalletResult {
  /** Newly initialised file-backed provider (KEK cached for the process). */
  provider: KeystoreProvider;
  /** A ready-to-use Signer for the freshly stored account. */
  signer: Signer;
  /** The stable reference that future `openLocalWallet` calls should use. */
  ref: SecretRef;
  /** Address derived from the stored mnemonic at `derivationPath`. */
  address: `0x${string}`;
  /**
   * The 12/24-word BIP-39 mnemonic. **Display once, then forget.** The
   * mnemonic is the only recovery material — back it up out-of-band.
   */
  mnemonic: string;
  /** Resolved on-disk path. */
  path: string;
}

/**
 * Initialise a fresh local wallet. Creates the encrypted keystore file
 * (refusing to overwrite), generates a mnemonic, stores it, and returns the
 * Signer + the mnemonic for one-time backup.
 */
export async function initLocalWallet(input: InitLocalWalletInput): Promise<InitLocalWalletResult> {
  const {
    passphrase,
    path = defaultKeystorePath(),
    label,
    service = DEFAULT_SERVICE,
    derivationPath = DEFAULT_PATH,
    capability,
    mnemonic: providedMnemonic,
    mnemonicStrength = 256,
    bip39Passphrase,
    kdf,
  } = input;

  if (!passphrase || passphrase.length < 8) {
    throw new KeystoreError({
      code: 'services/keystore/unsupported',
      message: 'passphrase must be at least 8 characters',
    });
  }

  const mnemonic = providedMnemonic ?? generateMnemonic(mnemonicStrength);
  const account = label ?? DEFAULT_ACCOUNT;
  const ref: SecretRef = { service, account };

  await initFileKeystore({ path, passphrase, ...(kdf !== undefined ? { kdf } : {}) });

  const provider = createFileKeystore({
    path,
    unlock: async () => ({ passphrase }),
  });

  const meta: Record<string, string> = {
    derivationPath,
    createdBy: '@cfxdevkit/wallet/init',
  };
  if (label) meta.label = label;

  // Derive the private key locally so we can store it under the file
  // backend's only supported kind ("private-key"). The mnemonic itself is
  // returned to the caller for one-time backup and never persisted.
  const derived = deriveAccount({
    mnemonic,
    path: derivationPath,
    ...(bip39Passphrase ? { passphrase: bip39Passphrase } : {}),
  });

  await provider.put?.({
    ref,
    kind: 'private-key',
    secret: derived.privateKey,
    meta,
  });

  const signer = await provider.getSigner(ref, capability);

  return {
    provider,
    signer,
    ref,
    address: derived.account.address,
    mnemonic,
    path,
  };
}

export interface OpenLocalWalletInput {
  passphrase: string;
  path?: string;
  ref?: SecretRef;
  capability?: Capability;
}

export interface OpenLocalWalletResult {
  provider: KeystoreProvider;
  signer: Signer;
  ref: SecretRef;
  path: string;
}

/**
 * Open an existing local wallet. The file must already exist; use
 * {@link initLocalWallet} for the first boot.
 */
export async function openLocalWallet(input: OpenLocalWalletInput): Promise<OpenLocalWalletResult> {
  const {
    passphrase,
    path = defaultKeystorePath(),
    ref = { service: DEFAULT_SERVICE, account: DEFAULT_ACCOUNT },
    capability,
  } = input;

  const provider = createFileKeystore({
    path,
    unlock: async () => ({ passphrase }),
  });
  const signer = await provider.getSigner(ref, capability);

  return { provider, signer, ref, path };
}

/** Re-encrypt the keystore under a new passphrase. Thin wrapper. */
export async function rotateLocalPassphrase(input: {
  oldPassphrase: string;
  newPassphrase: string;
  path?: string;
}): Promise<void> {
  await changeFilePassphrase({
    path: input.path ?? defaultKeystorePath(),
    oldPassphrase: input.oldPassphrase,
    newPassphrase: input.newPassphrase,
  });
}
