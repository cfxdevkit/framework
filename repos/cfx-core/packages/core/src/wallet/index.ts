/**
 * `@cfxdevkit/core/wallet` — HD derivation + the framework `Signer` interface.
 *
 * **In-memory only.** This module knows how to turn a mnemonic or private key
 * into a {@link Signer}. It does NOT persist anything, prompt the user, or
 * talk to a keystore — those concerns live in `framework/services/keystore`.
 *
 * Production code should obtain `Signer` instances via
 * `services/keystore`/`wallet/signers` and treat {@link signerFromPrivateKey}
 * as a low-level building block (it requires plaintext private material).
 *
 * ### Address format
 * Derived `Account.address` is always the **20-byte 0x-hex** form (the public
 * point hashed via Keccak-256, EIP-55 checksum). Conversion to Conflux Core
 * Space base32 (`cfx:` / `cfxtest:`) lives in `core/address` (Phase II); the
 * underlying secp256k1 key material is identical for both spaces.
 */
import { HDKey } from '@scure/bip32';
import {
  mnemonicToSeedSync,
  generateMnemonic as scureGenerateMnemonic,
  validateMnemonic as scureValidateMnemonic,
} from '@scure/bip39';
import { wordlist as english } from '@scure/bip39/wordlists/english';
import { privateKeyToAccount as civePrivateKeyToAccount } from 'cive/accounts';
import {
  privateKeyToAccount,
  signMessage as viemSignMessage,
  signTransaction as viemSignTransaction,
  signTypedData as viemSignTypedData,
} from 'viem/accounts';
import { WalletError } from '../errors/index.js';
import type { Address, ChainId, Hex, TypedData, Wei } from '../types/index.js';

/** Default BIP-44 derivation path for Conflux Core Space (coin type 503). */
export const DEFAULT_CORE_PATH = "m/44'/503'/0'/0/0" as const;

/** Default BIP-44 derivation path for Conflux eSpace / EVM (coin type 60). */
export const DEFAULT_ESPACE_PATH = "m/44'/60'/0'/0/0" as const;

/**
 * The public face of a key: address + secp256k1 public key. Private material
 * is held by the {@link Signer} and never leaks onto an `Account`.
 */
export interface Account {
  readonly address: Address;
  readonly publicKey: Hex;
}

/** Unsigned transaction payload accepted by {@link Signer.signTransaction}. */
export interface SignableTx {
  chainId: ChainId;
  to?: Address;
  value?: Wei;
  data?: Hex;
  nonce?: number;
  gas?: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
}

/** Per-signing-call options. */
export interface SignOptions {
  signal?: AbortSignal;
}

/**
 * The framework's signer abstraction. All signing methods are async to allow
 * keystore-backed and hardware-wallet implementations to fit the same shape.
 */
export interface Signer {
  readonly account: Account;
  signTransaction(tx: SignableTx, opts?: SignOptions): Promise<Hex>;
  signMessage(message: string | Uint8Array, opts?: SignOptions): Promise<Hex>;
  signTypedData(typedData: TypedData, opts?: SignOptions): Promise<Hex>;
}

// ── HD derivation ────────────────────────────────────────────────────────────

/**
 * Generate a fresh BIP-39 mnemonic.
 *
 * @param strength - Entropy in bits. 128 → 12 words (default), 256 → 24 words.
 * Anything other than 128/160/192/224/256 throws.
 */
export function generateMnemonic(strength: 128 | 160 | 192 | 224 | 256 = 128): string {
  return scureGenerateMnemonic(english, strength);
}

/** Validate a BIP-39 mnemonic against the English wordlist. */
export function validateMnemonic(mnemonic: string): boolean {
  return scureValidateMnemonic(mnemonic.trim(), english);
}

export interface DeriveAccountInput {
  mnemonic: string;
  /** BIP-32 derivation path. Defaults to {@link DEFAULT_CORE_PATH}. */
  path?: string;
  /** BIP-39 passphrase (the "25th word"). */
  passphrase?: string;
}

export interface DerivedAccount {
  account: Account;
  privateKey: Hex;
}

/** Derive a single account from a mnemonic. */
export function deriveAccount(input: DeriveAccountInput): DerivedAccount {
  const { mnemonic, path = DEFAULT_CORE_PATH, passphrase } = input;
  if (!validateMnemonic(mnemonic)) {
    throw new WalletError({
      code: 'core/wallet/derivation',
      message: 'Invalid BIP-39 mnemonic',
    });
  }
  const seed = mnemonicToSeedSync(mnemonic.trim(), passphrase ?? '');
  const root = HDKey.fromMasterSeed(seed);
  const child = root.derive(path);
  if (!child.privateKey) {
    throw new WalletError({
      code: 'core/wallet/derivation',
      message: `Failed to derive private key at path ${path}`,
      meta: { path },
    });
  }
  const privateKey = `0x${bytesToHex(child.privateKey)}` as Hex;
  const viemAccount = privateKeyToAccount(privateKey);
  return {
    account: { address: viemAccount.address, publicKey: viemAccount.publicKey },
    privateKey,
  };
}

export interface DeriveAccountsInput {
  mnemonic: string;
  /**
   * Base path; the address-index segment is appended. Default
   * `m/44'/503'/0'/0` — produces `…/0`, `…/1`, … up to `count - 1`.
   */
  basePath?: string;
  count: number;
  passphrase?: string;
}

/** Derive a contiguous range of accounts from a mnemonic. */
export function deriveAccounts(input: DeriveAccountsInput): DerivedAccount[] {
  const { mnemonic, basePath = "m/44'/503'/0'/0", count, passphrase } = input;
  if (!Number.isInteger(count) || count <= 0) {
    throw new WalletError({
      code: 'core/wallet/derivation',
      message: 'count must be a positive integer',
      meta: { count },
    });
  }
  const out: DerivedAccount[] = [];
  for (let i = 0; i < count; i++) {
    out.push(
      deriveAccount({
        mnemonic,
        path: `${basePath}/${i}`,
        ...(passphrase !== undefined ? { passphrase } : {}),
      }),
    );
  }
  return out;
}

// ── Conflux Core Space address ───────────────────────────────────────────────

/**
 * Conflux Core Space network ids used by `cive` for base32 encoding.
 *
 * - `1029` — mainnet (`cfx:…`)
 * - `1`    — testnet (`cfxtest:…`)
 * - `2029` — local devnet (`net2029:…`)
 */
export type CoreNetworkId = 1029 | 1 | 2029 | (number & {});

/**
 * Encode a private key as a Conflux Core Space base32 address (`cfx:…` /
 * `cfxtest:…` / `net<id>:…`). The same secp256k1 key produces both the
 * EVM 0x-hex address (`signerFromPrivateKey(...).account.address`) and a
 * Core Space base32 address — only the encoding differs.
 */
export function coreAddressFromPrivateKey(
  privateKey: Hex,
  networkId: CoreNetworkId = 1029,
): string {
  if (!/^0x[0-9a-fA-F]{64}$/.test(privateKey)) {
    throw new WalletError({
      code: 'core/wallet/derivation',
      message: 'privateKey must be a 0x-prefixed 32-byte hex string',
    });
  }
  try {
    const account = civePrivateKeyToAccount(privateKey, { networkId });
    return account.address;
  } catch (cause) {
    throw new WalletError({
      code: 'core/wallet/derivation',
      message: cause instanceof Error ? cause.message : String(cause),
      cause,
      meta: { networkId },
    });
  }
}

/** Derived account exposing both the EVM hex address and the Core base32 address. */
export interface DualAddressAccount {
  index: number;
  /** EIP-55 0x-hex address. */
  evmAddress: Address;
  /** Core Space base32 address (`cfx:…` / `cfxtest:…` / `net<id>:…`). */
  coreAddress: string;
  /** secp256k1 public key (uncompressed, 0x-hex). */
  publicKey: Hex;
  /** 32-byte private key (0x-hex). */
  privateKey: Hex;
  /** Derivation paths used. */
  paths: { evm: string; core: string };
}

export interface DeriveDualAccountInput {
  mnemonic: string;
  /** Address-index in the BIP-44 path. */
  index?: number;
  /**
   * Account-type segment of the BIP-44 path:
   * `'standard'` → `0'` (default), `'mining'` → `1'`.
   */
  accountType?: 'standard' | 'mining';
  /** Network id for the Core Space base32 encoding. Default mainnet (1029). */
  coreNetworkId?: CoreNetworkId;
  /** BIP-39 passphrase (the "25th word"). */
  passphrase?: string;
}

/**
 * Derive one dual-space account: secp256k1 key once, both encodings.
 *
 * Conflux uses BIP-44 coin type `503`; eSpace mirrors Ethereum at coin type
 * `60`. The two encodings are produced from independent derivation paths
 * (this matches the convention of the original `@cfxdevkit/core-core` POC).
 */
export function deriveDualAccount(input: DeriveDualAccountInput): DualAddressAccount {
  const { mnemonic, index = 0, accountType = 'standard', coreNetworkId = 1029, passphrase } = input;

  if (!Number.isInteger(index) || index < 0) {
    throw new WalletError({
      code: 'core/wallet/derivation',
      message: 'index must be a non-negative integer',
      meta: { index },
    });
  }

  const acctSeg = accountType === 'standard' ? 0 : 1;
  const evmPath = `m/44'/60'/${acctSeg}'/0/${index}`;
  const corePath = `m/44'/503'/${acctSeg}'/0/${index}`;

  const evm = deriveAccount({
    mnemonic,
    path: evmPath,
    ...(passphrase !== undefined ? { passphrase } : {}),
  });
  const core = deriveAccount({
    mnemonic,
    path: corePath,
    ...(passphrase !== undefined ? { passphrase } : {}),
  });

  return {
    index,
    evmAddress: evm.account.address,
    coreAddress: coreAddressFromPrivateKey(core.privateKey, coreNetworkId),
    publicKey: evm.account.publicKey,
    privateKey: evm.privateKey,
    paths: { evm: evmPath, core: corePath },
  };
}

/** Derive a contiguous range of dual-space accounts. */
export function deriveDualAccounts(
  input: DeriveDualAccountInput & { count: number; startIndex?: number },
): DualAddressAccount[] {
  const { count, startIndex = 0, ...rest } = input;
  if (!Number.isInteger(count) || count <= 0) {
    throw new WalletError({
      code: 'core/wallet/derivation',
      message: 'count must be a positive integer',
      meta: { count },
    });
  }
  const out: DualAddressAccount[] = [];
  for (let i = 0; i < count; i++) {
    out.push(deriveDualAccount({ ...rest, index: startIndex + i }));
  }
  return out;
}

// ── Signer factory ───────────────────────────────────────────────────────────

/**
 * Build a {@link Signer} from a raw private key.
 *
 * @internal Production code should use `services/keystore` →
 * `wallet/signers.signerFromKeystore`. This factory exists for tests, scripts
 * and as the implementation primitive other signer factories build on.
 */
export function signerFromPrivateKey(privateKey: Hex): Signer {
  if (!/^0x[0-9a-fA-F]{64}$/.test(privateKey)) {
    throw new WalletError({
      code: 'core/wallet/derivation',
      message: 'privateKey must be a 0x-prefixed 32-byte hex string',
    });
  }
  const local = privateKeyToAccount(privateKey);
  const account: Account = { address: local.address, publicKey: local.publicKey };

  return {
    account,

    async signTransaction(tx: SignableTx, _opts?: SignOptions): Promise<Hex> {
      try {
        // viem expects EIP-1559 fields plus an explicit type tag for ergonomic typing.
        const tx1559 = {
          chainId: tx.chainId,
          to: tx.to,
          value: tx.value,
          data: tx.data,
          nonce: tx.nonce,
          gas: tx.gas,
          maxFeePerGas: tx.maxFeePerGas,
          maxPriorityFeePerGas: tx.maxPriorityFeePerGas,
          type: 'eip1559' as const,
        };
        return await viemSignTransaction({
          privateKey,
          transaction: tx1559 as never,
        });
      } catch (cause) {
        throw new WalletError({
          code: 'core/wallet/sign-rejected',
          message: cause instanceof Error ? cause.message : String(cause),
          cause,
        });
      }
    },

    async signMessage(message: string | Uint8Array, _opts?: SignOptions): Promise<Hex> {
      try {
        return await viemSignMessage({
          privateKey,
          message: typeof message === 'string' ? message : { raw: message },
        });
      } catch (cause) {
        throw new WalletError({
          code: 'core/wallet/sign-rejected',
          message: cause instanceof Error ? cause.message : String(cause),
          cause,
        });
      }
    },

    async signTypedData(typedData: TypedData, _opts?: SignOptions): Promise<Hex> {
      try {
        return await viemSignTypedData({
          privateKey,
          ...(typedData as unknown as Record<string, unknown>),
        } as never);
      } catch (cause) {
        throw new WalletError({
          code: 'core/wallet/sign-rejected',
          message: cause instanceof Error ? cause.message : String(cause),
          cause,
        });
      }
    },
  };
}

// ── helpers ──────────────────────────────────────────────────────────────────

function bytesToHex(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i++) {
    // biome-ignore lint/style/noNonNullAssertion: bounded loop, byte present
    s += bytes[i]!.toString(16).padStart(2, '0');
  }
  return s;
}
