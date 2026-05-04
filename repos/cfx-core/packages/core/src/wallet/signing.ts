import { signTransaction as civeSignTransaction } from 'cive/accounts';
import { WalletError } from '../errors/index.js';
import type { Hex } from '../types/index.js';
import type { SignableTx } from './index.js';

export async function signCoreTransaction(privateKey: Hex, tx: SignableTx): Promise<string> {
  requireCoreTxField(tx.epochHeight, 'epochHeight');
  requireCoreTxField(tx.nonce, 'nonce');
  requireCoreTxField(tx.gas, 'gas');
  requireCoreTxField(tx.storageLimit, 'storageLimit');
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
  const transaction =
    coreType === 'cip1559'
      ? cip1559Transaction(base, tx)
      : legacyCoreTransaction(base, tx, coreType);
  return (await civeSignTransaction({ privateKey, transaction: transaction as never })) as string;
}

function requireCoreTxField<T>(value: T | undefined, name: string): asserts value is T {
  if (value === undefined) {
    throw new WalletError({
      code: 'core/wallet/sign-rejected',
      message: `Core Space transactions require \`${name}\``,
    });
  }
}

function cip1559Transaction(base: Record<string, unknown>, tx: SignableTx) {
  if (tx.maxFeePerGas === undefined || tx.maxPriorityFeePerGas === undefined) {
    throw new WalletError({
      code: 'core/wallet/sign-rejected',
      message: 'cip1559 Core Space tx requires maxFeePerGas + maxPriorityFeePerGas',
    });
  }
  return {
    ...base,
    type: 'eip1559',
    maxFeePerGas: tx.maxFeePerGas,
    maxPriorityFeePerGas: tx.maxPriorityFeePerGas,
  };
}

function legacyCoreTransaction(
  base: Record<string, unknown>,
  tx: SignableTx,
  coreType: 'legacy' | 'cip2930',
) {
  if (tx.gasPrice === undefined) {
    throw new WalletError({
      code: 'core/wallet/sign-rejected',
      message: `${coreType} Core Space tx requires gasPrice`,
    });
  }
  return {
    ...base,
    type: coreType === 'cip2930' ? 'eip2930' : 'legacy',
    gasPrice: tx.gasPrice,
    ...(coreType === 'cip2930' ? { accessList: [] } : {}),
  };
}
