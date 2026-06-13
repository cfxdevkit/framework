import { type Hex, KeystoreError, type SignableTx } from '@cfxdevkit/cdk';
import { base32AddressToHex, concatHex, toHex, toRlp } from 'cive/utils';
import type { LedgerSignature } from '../types.js';

type RequiredCoreTx = Required<Pick<SignableTx, 'epochHeight' | 'gas' | 'nonce' | 'storageLimit'>>;

export function serializeCoreTransaction(tx: SignableTx): Hex {
  const coreType = tx.coreType ?? 'cip2930';
  if (coreType === 'cip1559') return serializeCore1559(tx);
  if (coreType === 'cip2930') return serializeCore2930(tx);
  return serializeCoreLegacy(tx);
}

export function finaliseCoreTransaction(tx: SignableTx, signature: LedgerSignature): Hex {
  const coreType = tx.coreType ?? 'cip2930';
  if (coreType === 'cip1559') return serializeCore1559(tx, signature);
  if (coreType === 'cip2930') return serializeCore2930(tx, signature);
  return serializeCoreLegacy(tx, signature);
}

function serializeCore1559(tx: SignableTx, signature?: LedgerSignature): Hex {
  const requiredTx = requireCoreTx(tx);
  if (tx.maxFeePerGas === undefined || tx.maxPriorityFeePerGas === undefined) {
    throw unsupported('cip1559 Core Space tx requires maxFeePerGas + maxPriorityFeePerGas');
  }
  const values = [
    quantity(requiredTx.nonce),
    quantity(tx.maxPriorityFeePerGas),
    quantity(tx.maxFeePerGas),
    quantity(requiredTx.gas),
    toCoreHex(tx.to),
    quantity(tx.value ?? 0n),
    quantity(requiredTx.storageLimit),
    quantity(requiredTx.epochHeight),
    toHex(tx.chainId),
    tx.data ?? '0x',
    [],
  ];
  return signature
    ? concatHex(['0x02', encodeRlp([values, sigV(signature), signature.r, signature.s])])
    : concatHex(['0x02', encodeRlp(values)]);
}

function serializeCore2930(tx: SignableTx, signature?: LedgerSignature): Hex {
  const requiredTx = requireCoreTx(tx);
  if (tx.gasPrice === undefined) throw unsupported('cip2930 Core Space tx requires gasPrice');
  const values = coreValues(tx, requiredTx, [toHex(tx.chainId), tx.data ?? '0x', []]);
  return signature
    ? concatHex(['0x01', encodeRlp([values, sigV(signature), signature.r, signature.s])])
    : concatHex(['0x01', encodeRlp(values)]);
}

function serializeCoreLegacy(tx: SignableTx, signature?: LedgerSignature): Hex {
  const requiredTx = requireCoreTx(tx);
  if (tx.gasPrice === undefined) throw unsupported('legacy Core Space tx requires gasPrice');
  const values = coreValues(tx, requiredTx, [toHex(tx.chainId), tx.data ?? '0x']);
  return signature
    ? encodeRlp([values, sigV(signature), signature.r, signature.s])
    : encodeRlp(values);
}

function coreValues(tx: SignableTx, requiredTx: RequiredCoreTx, tail: unknown[]): unknown[] {
  return [
    quantity(requiredTx.nonce),
    quantity(tx.gasPrice ?? 0n),
    quantity(requiredTx.gas),
    toCoreHex(tx.to),
    quantity(tx.value ?? 0n),
    quantity(requiredTx.storageLimit),
    quantity(requiredTx.epochHeight),
    ...tail,
  ];
}

function requireCoreTx(tx: SignableTx): RequiredCoreTx {
  for (const field of ['epochHeight', 'nonce', 'gas', 'storageLimit'] as const) {
    if (tx[field] === undefined) throw unsupported(`Core Space transactions require \`${field}\``);
  }
  return tx as RequiredCoreTx;
}

function toCoreHex(value: SignableTx['to']): Hex {
  if (!value) return '0x';
  return value.startsWith('0x')
    ? (value as Hex)
    : (base32AddressToHex({ address: value as never }) as Hex);
}

function quantity(value: bigint | number): Hex {
  return value === 0 || value === 0n ? '0x' : toHex(value);
}

function sigV(signature: LedgerSignature): Hex {
  return quantity(signature.v);
}

function encodeRlp(value: unknown): Hex {
  return toRlp(value as never);
}

function unsupported(message: string): KeystoreError {
  return new KeystoreError({ code: 'services/keystore/ledger/unsupported-core-tx', message });
}
