import type { Address, Hex } from '@cfxdevkit/cdk';
import { KeystoreError, type SignableTx } from '@cfxdevkit/cdk';
import { serializeTransaction, type TransactionSerializableEIP1559 } from 'viem';
import type { LedgerSignature, LedgerSignatureResponse } from './types.js';

export function toEip1559(tx: SignableTx): TransactionSerializableEIP1559 {
  if (tx.maxFeePerGas === undefined || tx.maxPriorityFeePerGas === undefined) {
    throw new KeystoreError({
      code: 'services/keystore/ledger/unsupported-tx-type',
      message: 'Ledger backend currently signs eSpace EIP-1559 transactions',
    });
  }
  return {
    type: 'eip1559',
    chainId: Number(tx.chainId),
    ...(tx.to !== undefined ? { to: tx.to as Address } : {}),
    ...(tx.value !== undefined ? { value: tx.value } : {}),
    ...(tx.data !== undefined ? { data: tx.data } : {}),
    ...(tx.nonce !== undefined ? { nonce: tx.nonce } : {}),
    ...(tx.gas !== undefined ? { gas: tx.gas } : {}),
    maxFeePerGas: tx.maxFeePerGas,
    maxPriorityFeePerGas: tx.maxPriorityFeePerGas,
  };
}

export function finaliseEip1559Tx(tx: TransactionSerializableEIP1559, sig: LedgerSignature): Hex {
  let yParity = sig.v;
  if (yParity === 27 || yParity === 28) yParity -= 27;
  if (yParity !== 0 && yParity !== 1) throw badSignature(`invalid v parity ${sig.v}`);
  return serializeTransaction(
    { ...tx, type: 'eip1559' },
    { r: sig.r, s: sig.s, yParity: yParity as 0 | 1 },
  );
}

export function normaliseLedgerSignature(sig: LedgerSignatureResponse): LedgerSignature {
  return {
    r: signaturePart(sig.r, 'r'),
    s: signaturePart(sig.s, 's'),
    v: parseV(sig.v),
  };
}

export function signatureToHex(sig: LedgerSignature): Hex {
  let v = sig.v;
  if (v === 0 || v === 1) v += 27;
  if (v !== 27 && v !== 28) throw badSignature(`invalid message v ${sig.v}`);
  return `0x${stripHex(sig.r)}${stripHex(sig.s)}${v.toString(16).padStart(2, '0')}` as Hex;
}

export function canonicalHex(value: string): Hex {
  const stripped = stripHex(value);
  if (!/^[0-9a-fA-F]*$/.test(stripped)) {
    throw new KeystoreError({
      code: 'services/keystore/ledger/bad-response',
      message: 'Ledger returned non-hex data',
    });
  }
  return `0x${stripped.toLowerCase()}` as Hex;
}

export function messageHex(message: string | Uint8Array): Hex {
  if (typeof message === 'string') {
    let hex = '';
    for (let index = 0; index < message.length; index++) {
      hex += message.charCodeAt(index).toString(16).padStart(2, '0');
    }
    return `0x${hex}` as Hex;
  }
  let hex = '';
  for (let index = 0; index < message.length; index++) {
    hex += message[index]?.toString(16).padStart(2, '0') ?? '';
  }
  return `0x${hex}` as Hex;
}

export function stripHex(value: string): string {
  return value.startsWith('0x') || value.startsWith('0X') ? value.slice(2) : value;
}

function signaturePart(value: string, name: 'r' | 's'): Hex {
  const stripped = stripHex(value).padStart(64, '0');
  if (!/^[0-9a-fA-F]{64}$/.test(stripped)) throw badSignature(`${name} must be 32 bytes`);
  return `0x${stripped.toLowerCase()}` as Hex;
}

function parseV(v: string | number): number {
  if (typeof v === 'number') return v;
  const stripped = stripHex(v);
  return Number.parseInt(stripped || '0', 16);
}

function badSignature(message: string): KeystoreError {
  return new KeystoreError({ code: 'services/keystore/ledger/bad-signature', message });
}
