import {
  privateKeyToAccount as viemPrivateKeyToAccount,
  signMessage as viemSignMessage,
  signTransaction as viemSignTransaction,
  signTypedData as viemSignTypedData,
} from 'viem/accounts';
import {
  privateKeyToAccount as civePrivateKeyToAccount,
} from 'cive/accounts';
import { WalletError } from '../errors/index.js';
import type { Address, ChainId, CfxAddress, Hex, TypedData, Wei } from '../types/index.js';
import {
  deriveKeyPair,
  accountFromPrivateKey,
  DEFAULT_ESPACE_PATH,
} from './derivation.js';
import { signCoreTransaction } from './signing.js';

export type {
  AnyAccount,
  DeriveAccountInput,
  DeriveAccountsInput,
  DeriveDualAccountInput,
  DerivedAccount,
  DualAccount,
} from './derivation.js';
export {
  DEFAULT_CORE_PATH,
  DEFAULT_ESPACE_PATH,
  deriveAccount,
  deriveAccounts,
  deriveDualAccount,
  deriveDualAccounts,
  generateMnemonic,
  validateMnemonic,
  accountFromPrivateKey,
} from './derivation.js';

// ── Types ────────────────────────────────────────────────────────────────────

/**
 * A signing-capable account — either viem or cive based.
 *
 * Contains `signTransaction`, `signMessage`, `signTypedData` from the
 * underlying library (viem or cive). The `address` is hex for eSpace
 * (viem) or base32 for Core Space (cive).
 */
export interface Account {
  /** Hex address (viem/eSpace) or base32 address (cive/Core Space). */
  readonly address: Address | CfxAddress;
  readonly publicKey: Hex;
}

export interface SignableTx {
  /** Target chain family. Required for cross-space signers. */
  family?: 'espace' | 'core';
  chainId: ChainId;
  to?: Address | string;
  value?: Wei;
  data?: Hex;
  nonce?: number;
  gas?: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  gasPrice?: bigint;
  storageLimit?: bigint;
  epochHeight?: bigint;
  coreType?: 'legacy' | 'cip2930' | 'cip1559';
}

export interface SignOptions {
  signal?: AbortSignal;
}

/**
 * A unified signing interface that wraps a single-key account.
 *
 * For dual-space signing, use {@link Signer} returned by
 * {@link signerFromDualMnemonic}, which dispatches by `tx.family`.
 */
export interface Signer {
  /** The underlying account (viem or cive based). */
  readonly account: Account;
  signTransaction(tx: SignableTx, opts?: SignOptions): Promise<Hex>;
  signMessage(message: string | Uint8Array, opts?: SignOptions): Promise<Hex>;
  signTypedData(typedData: TypedData, opts?: SignOptions): Promise<Hex>;
}

// ── Single-key signers ──────────────────────────────────────────────────────

/**
 * Create a Signer from a raw private key.
 *
 * The `family` parameter selects the signing backend:
 *   - `espace` (default) → viem, EIP-1559
 *   - `core` → cive, CIP-1559/2930
 *
 * Prefer `signerFromMnemonic()` — it derives keys internally.
 */
export interface SignerFromPrivateKeyInput {
  family?: 'espace' | 'core';
  /** Required when family is 'core'. */
  coreNetworkId?: number;
}

export function signerFromPrivateKey(
  privateKey: Hex,
  input?: SignerFromPrivateKeyInput,
): Signer {
  if (!/^0x[0-9a-fA-F]{64}$/.test(privateKey)) {
    throw new WalletError({
      code: 'core/wallet/derivation',
      message: 'privateKey must be a 0x-prefixed 32-byte hex string',
    });
  }

  const { family = 'espace', coreNetworkId } = input ?? {};

  let account: Account;

  if (family === 'core') {
    if (coreNetworkId === undefined) {
      throw new WalletError({
        code: 'core/wallet/derivation',
        message: 'coreNetworkId is required when family is "core"',
      });
    }
    const civeAcc = civePrivateKeyToAccount(privateKey, { networkId: coreNetworkId });
    account = { address: civeAcc.address, publicKey: civeAcc.publicKey };
  } else {
    const viemAcc = viemPrivateKeyToAccount(privateKey);
    account = { address: viemAcc.address, publicKey: viemAcc.publicKey };
  }

  return {
    account,
    async signTransaction(tx: SignableTx, _opts?: SignOptions): Promise<Hex> {
      try {
        if (family === 'core' || tx.family === 'core')
          return (await signCoreTransaction(privateKey, tx)) as Hex;
        return await viemSignTransaction({
          privateKey,
          transaction: eip1559Tx(tx) as never,
        });
      } catch (cause) {
        throw signRejected(cause);
      }
    },
    async signMessage(message: string | Uint8Array, _opts?: SignOptions): Promise<Hex> {
      try {
        return await viemSignMessage({
          privateKey,
          message: typeof message === 'string' ? message : { raw: message },
        });
      } catch (cause) {
        throw signRejected(cause);
      }
    },
    async signTypedData(typedData: TypedData, _opts?: SignOptions): Promise<Hex> {
      try {
        return await viemSignTypedData({
          privateKey,
          ...(typedData as unknown as Record<string, unknown>),
        } as never);
      } catch (cause) {
        throw signRejected(cause);
      }
    },
  };
}

// ── Mnemonic-based single-space signer ──────────────────────────────────────

export interface SignerFromMnemonicInput {
  /** Derivation path. Defaults to eSpace (`m/44'/60'/0'/0/0`). */
  path?: string;
  /** Core network ID — required when path is Core Space. */
  coreNetworkId?: number;
  passphrase?: string;
}

/**
 * Create a single-space Signer directly from a mnemonic.
 *
 * Derives the private key internally — you never see or store it.
 *
 * Path-aware: eSpace paths use viem, Core paths use cive.
 *
 * ```ts
 * const mnemonic = generateMnemonic();
 * // eSpace signer
 * const signer = signerFromMnemonic({ mnemonic, path: "m/44'/60'/0'/0/0" });
 * // Core Space signer (testnet)
 * const coreSigner = signerFromMnemonic({ mnemonic, path: "m/44'/503'/0'/0/0", coreNetworkId: 1 });
 * ```
 */
export function signerFromMnemonic(
  input: { mnemonic: string } & SignerFromMnemonicInput,
): Signer {
  const { mnemonic, path = DEFAULT_ESPACE_PATH, coreNetworkId, passphrase } = input;

  const isCore = path.startsWith("m/44'/503'");
  const { privateKey } = deriveKeyPair(mnemonic, path, passphrase);

  if (isCore && coreNetworkId === undefined) {
    throw new WalletError({
      code: 'core/wallet/derivation',
      message:
        'coreNetworkId is required for Core Space paths (m/44\'/503\'/...). ' +
        'Pass coreNetworkId or use resolveNetworkIds("testnet") for testnet IDs.',
      meta: { path },
    });
  }

  const derived = accountFromPrivateKey(privateKey, {
    path,
    ...(coreNetworkId !== undefined ? { coreNetworkId } : {}),
  });
  const account: Account = { address: derived.address, publicKey: derived.publicKey };

  return {
    account,
    async signTransaction(tx: SignableTx, _opts?: SignOptions): Promise<Hex> {
      try {
        if (isCore || tx.family === 'core')
          return (await signCoreTransaction(privateKey, tx)) as Hex;
        return await viemSignTransaction({
          privateKey,
          transaction: eip1559Tx(tx) as never,
        });
      } catch (cause) {
        throw signRejected(cause);
      }
    },
    async signMessage(message: string | Uint8Array, _opts?: SignOptions): Promise<Hex> {
      try {
        return await viemSignMessage({
          privateKey,
          message: typeof message === 'string' ? message : { raw: message },
        });
      } catch (cause) {
        throw signRejected(cause);
      }
    },
    async signTypedData(typedData: TypedData, _opts?: SignOptions): Promise<Hex> {
      try {
        return await viemSignTypedData({
          privateKey,
          ...(typedData as unknown as Record<string, unknown>),
        } as never);
      } catch (cause) {
        throw signRejected(cause);
      }
    },
  };
}

// ── Dual-space signer ───────────────────────────────────────────────────────

export interface DualSignerFromMnemonicInput {
  index?: number;
  accountType?: 'standard' | 'mining';
  /** Core network ID — required. */
  coreNetworkId?: number;
  passphrase?: string;
}

/**
 * Create a cross-space Signer from a mnemonic.
 *
 * Derives two independent keypairs internally — you never see raw keys.
 *
 * Dispatches signing by `tx.family`:
 *   - `family: 'espace'` → eSpace key (viem, EIP-1559)
 *   - `family: 'core'` → Core key (cive, CIP-1559/2930)
 *   - `signMessage()` / `signTypedData()` → eSpace key (EIP-191)
 *
 * ```ts
 * const mnemonic = generateMnemonic();
 * const signer = signerFromDualMnemonic({ mnemonic, coreNetworkId: 1 });
 * // Sign eSpace tx
 * await signer.signTransaction({ family: 'espace', chainId: 71, ... });
 * // Sign Core tx
 * await signer.signTransaction({ family: 'core', chainId: 1, ... });
 * ```
 */
export function signerFromDualMnemonic(
  input: { mnemonic: string } & DualSignerFromMnemonicInput,
): Signer {
  const { mnemonic, index = 0, accountType = 'standard', coreNetworkId, passphrase } = input;
  if (coreNetworkId === undefined) {
    throw new WalletError({
      code: 'core/wallet/derivation',
      message: 'coreNetworkId is required for cross-space signing',
    });
  }

  const accountSegment = accountType === 'standard' ? 0 : 1;
  const evmPath = `m/44'/60'/${accountSegment}'/0/${index}`;
  const corePath = `m/44'/503'/${accountSegment}'/0/${index}`;

  const evmPair = deriveKeyPair(mnemonic, evmPath, passphrase);
  const corePair = deriveKeyPair(mnemonic, corePath, passphrase);

  const evmAcc = accountFromPrivateKey(evmPair.privateKey, { path: evmPath });
  // coreAcc is used for signing Core Space transactions via signCoreTransaction
  // below, which takes the raw private key directly (no account object needed).
  accountFromPrivateKey(corePair.privateKey, {
    path: corePath,
    coreNetworkId,
  });

  return {
    account: {
      address: evmAcc.address,
      publicKey: evmAcc.publicKey,
    },
    async signTransaction(tx: SignableTx, _opts?: SignOptions): Promise<Hex> {
      try {
        if (tx.family === 'core') {
          return (await signCoreTransaction(corePair.privateKey, tx)) as Hex;
        }
        return await viemSignTransaction({
          privateKey: evmPair.privateKey,
          transaction: eip1559Tx(tx) as never,
        });
      } catch (cause) {
        throw signRejected(cause);
      }
    },
    async signMessage(message: string | Uint8Array, _opts?: SignOptions): Promise<Hex> {
      try {
        return await viemSignMessage({
          privateKey: evmPair.privateKey,
          message: typeof message === 'string' ? message : { raw: message },
        });
      } catch (cause) {
        throw signRejected(cause);
      }
    },
    async signTypedData(typedData: TypedData, _opts?: SignOptions): Promise<Hex> {
      try {
        return await viemSignTypedData({
          privateKey: evmPair.privateKey,
          ...(typedData as unknown as Record<string, unknown>),
        } as never);
      } catch (cause) {
        throw signRejected(cause);
      }
    },
  };
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function eip1559Tx(tx: SignableTx) {
  return {
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
}

function signRejected(cause: unknown) {
  return new WalletError({
    code: 'core/wallet/sign-rejected',
    message: cause instanceof Error ? cause.message : String(cause),
    cause,
  });
}
