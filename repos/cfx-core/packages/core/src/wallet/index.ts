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
 * Derived `Account.address` is always the **20-byte 0x-hex** form. Conversion
 * to Conflux Core Space base32 (`cfx:` / `cfxtest:`) is done via
 * {@link coreAddressFromPrivateKey} / {@link deriveDualAccount}; the
 * underlying secp256k1 key material is identical for both spaces.
 */
import { HDKey } from '@scure/bip32';
import {
  mnemonicToSeedSync,
  generateMnemonic as scureGenerateMnemonic,
  validateMnemonic as scureValidateMnemonic,
} from '@scure/bip39';
import { wordlist as english } from '@scure/bip39/wordlists/english';
import {
  privateKeyToAccount as civePrivateKeyToAccount,
  signTransaction as civeSignTransaction,
} from 'cive/accounts';
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
  /** Optional Core Space base32 address; populated by dual-address signers. */
  readonly coreAddress?: string;
}

/**
 * Unsigned transaction payload accepted by {@link Signer.signTransaction}.
 *
 * Tagged with `family` so a single {@link Signer} can produce raw
 * transactions for either eSpace (EIP-1559) or Conflux Core Space
 * (legacy / cip2930 / cip1559 with `storageLimit` + `epochHeight`).
 *
 * `to` accepts a `0x…` hex address for eSpace and a `cfx:…` / `cfxtest:…`
 * base32 address for Core Space.
 */
export interface SignableTx {
  /** Defaults to `'espace'` when omitted (back-compat). */
  family?: 'espace' | 'core';
  chainId: ChainId;
  to?: Address | string;
  value?: Wei;
  data?: Hex;
  nonce?: number;
  gas?: bigint;
  // ── eSpace (EIP-1559) ──
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  // ── Core Space ──
  /** Per-byte gas price (drip). Required for Core legacy/cip2930. */
  gasPrice?: bigint;
  /** Conflux storage collateral budget (in 1/1024 CFX units). */
  storageLimit?: bigint;
  /** Epoch number after which the tx expires; required for Core. */
  epochHeight?: bigint;
  /** Conflux Core Space tx flavor. Defaults to `'cip2930'`. */
  coreType?: 'legacy' | 'cip2930' | 'cip1559';
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

export function generateMnemonic(strength: 128 | 160 | 192 | 224 | 256 = 128): string {
  return scureGenerateMnemonic(english, strength);
}

export function validateMnemonic(mnemonic: string): boolean {
  return scureValidateMnemonic(mnemonic.trim(), english);
}

export interface DeriveAccountInput {
  mnemonic: string;
  path?: string;
  passphrase?: string;
}

export interface DerivedAccount {
  account: Account;
  privateKey: Hex;
}

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
  basePath?: string;
  count: number;
  passphrase?: string;
}

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

export type CoreNetworkId = 1029 | 1 | 2029 | (number & {});

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

export interface DualAddressAccount {
  index: number;
  evmAddress: Address;
  coreAddress: string;
  publicKey: Hex;
  privateKey: Hex;
  paths: { evm: string; core: string };
}

export interface DeriveDualAccountInput {
  mnemonic: string;
  index?: number;
  accountType?: 'standard' | 'mining';
  coreNetworkId?: CoreNetworkId;
  passphrase?: string;
}

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
 * @param coreNetworkId - When provided, the signer's `account.coreAddress` is
 *   populated with the matching base32 encoding, enabling Core Space writes.
 */
export function signerFromPrivateKey(privateKey: Hex, coreNetworkId?: CoreNetworkId): Signer {
  if (!/^0x[0-9a-fA-F]{64}$/.test(privateKey)) {
    throw new WalletError({
      code: 'core/wallet/derivation',
      message: 'privateKey must be a 0x-prefixed 32-byte hex string',
    });
  }
  const local = privateKeyToAccount(privateKey);
  const account: Account = {
    address: local.address,
    publicKey: local.publicKey,
    ...(coreNetworkId !== undefined
      ? { coreAddress: coreAddressFromPrivateKey(privateKey, coreNetworkId) }
      : {}),
  };

  return {
    account,

    async signTransaction(tx: SignableTx, _opts?: SignOptions): Promise<Hex> {
      try {
        if (tx.family === 'core') {
          return (await signCoreTransaction(privateKey, tx)) as Hex;
        }
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

/** Sign a Core Space transaction using cive's RLP serializer. */
async function signCoreTransaction(privateKey: Hex, tx: SignableTx): Promise<string> {
  if (tx.epochHeight === undefined) {
    throw new WalletError({
      code: 'core/wallet/sign-rejected',
      message: 'Core Space transactions require `epochHeight`',
    });
  }
  if (tx.nonce === undefined) {
    throw new WalletError({
      code: 'core/wallet/sign-rejected',
      message: 'Core Space transactions require `nonce`',
    });
  }
  if (tx.gas === undefined) {
    throw new WalletError({
      code: 'core/wallet/sign-rejected',
      message: 'Core Space transactions require `gas`',
    });
  }
  if (tx.storageLimit === undefined) {
    throw new WalletError({
      code: 'core/wallet/sign-rejected',
      message: 'Core Space transactions require `storageLimit`',
    });
  }

  const coreType = tx.coreType ?? 'cip2930';
  const base: Record<string, unknown> = {
    chainId: tx.chainId,
    nonce: tx.nonce,
    gas: tx.gas,
    to: tx.to,
    value: tx.value,
    data: tx.data,
    storageLimit: tx.storageLimit,
    epochHeight: tx.epochHeight,
  };

  let transaction: Record<string, unknown>;
  if (coreType === 'cip1559') {
    if (tx.maxFeePerGas === undefined || tx.maxPriorityFeePerGas === undefined) {
      throw new WalletError({
        code: 'core/wallet/sign-rejected',
        message: 'cip1559 Core Space tx requires maxFeePerGas + maxPriorityFeePerGas',
      });
    }
    transaction = {
      ...base,
      type: 'eip1559',
      maxFeePerGas: tx.maxFeePerGas,
      maxPriorityFeePerGas: tx.maxPriorityFeePerGas,
    };
  } else {
    if (tx.gasPrice === undefined) {
      throw new WalletError({
        code: 'core/wallet/sign-rejected',
        message: `${coreType} Core Space tx requires gasPrice`,
      });
    }
    transaction = {
      ...base,
      type: coreType === 'cip2930' ? 'eip2930' : 'legacy',
      gasPrice: tx.gasPrice,
      ...(coreType === 'cip2930' ? { accessList: [] } : {}),
    };
  }

  return (await civeSignTransaction({
    privateKey,
    transaction: transaction as never,
  })) as string;
}

function bytesToHex(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i++) {
    // biome-ignore lint/style/noNonNullAssertion: bounded loop, byte present
    s += bytes[i]!.toString(16).padStart(2, '0');
  }
  return s;
}
