import {
  privateKeyToAccount,
  signMessage as viemSignMessage,
  signTransaction as viemSignTransaction,
  signTypedData as viemSignTypedData,
} from 'viem/accounts';
import { WalletError } from '../errors/index.js';
import type { Address, ChainId, Hex, TypedData, Wei } from '../types/index.js';
import { type CoreNetworkId, coreAddressFromPrivateKey } from './derivation.js';
import { signCoreTransaction } from './signing.js';

export type {
  CoreNetworkId,
  DeriveAccountInput,
  DeriveAccountsInput,
  DeriveDualAccountInput,
  DerivedAccount,
  DualAddressAccount,
} from './derivation.js';
export {
  coreAddressFromPrivateKey,
  DEFAULT_CORE_PATH,
  DEFAULT_ESPACE_PATH,
  deriveAccount,
  deriveAccounts,
  deriveDualAccount,
  deriveDualAccounts,
  generateMnemonic,
  validateMnemonic,
} from './derivation.js';

export interface Account {
  readonly address: Address;
  readonly publicKey: Hex;
  readonly coreAddress?: string;
}

export interface SignableTx {
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

export interface Signer {
  readonly account: Account;
  signTransaction(tx: SignableTx, opts?: SignOptions): Promise<Hex>;
  signMessage(message: string | Uint8Array, opts?: SignOptions): Promise<Hex>;
  signTypedData(typedData: TypedData, opts?: SignOptions): Promise<Hex>;
}

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
        if (tx.family === 'core') return (await signCoreTransaction(privateKey, tx)) as Hex;
        return await viemSignTransaction({ privateKey, transaction: eip1559Tx(tx) as never });
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
