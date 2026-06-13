import { type Address, type Hex, KeystoreError, type SignableTx } from '@cfxdevkit/cdk';
import { base32AddressToHex, publicKeyToAddress } from 'cive/utils';
import type { LedgerTransportLike } from '../types.js';
import {
  bytesToHex,
  concatBytes,
  encodePath,
  exchange,
  exchangeChunks,
  hexToBytes,
  parseLedgerSignature,
  signatureToHex,
  uint32,
} from './framing.js';
import { finaliseCoreTransaction, serializeCoreTransaction } from './transaction.js';

const INS_GET_PUBLIC_KEY = 0x02;
const INS_SIGN_TX = 0x03;
const INS_SIGN_PERSONAL = 0x04;
const INS_GET_APP_INFO = 0x01;

export interface CoreLedgerInfo {
  flags: number;
  major: number;
  minor: number;
  patch: number;
}

export interface CoreAddressResult {
  address: Address;
  coreAddress: string;
  publicKey: Hex;
}

export async function getCoreLedgerInfo(transport: LedgerTransportLike): Promise<CoreLedgerInfo> {
  const response = await exchange(transport, INS_GET_APP_INFO, 0, 0, new Uint8Array());
  if (response.length < 4) throw coreError(`expected 4-byte app info, got ${response.length}`);
  return {
    flags: response[0] ?? 0,
    major: response[1] ?? 0,
    minor: response[2] ?? 0,
    patch: response[3] ?? 0,
  };
}

export async function getCoreLedgerAddress(input: {
  transport: LedgerTransportLike;
  path: string;
  networkId: number;
  display?: boolean;
}): Promise<CoreAddressResult> {
  const pathPayload = encodePath(input.path);
  const payload = input.display ? concatBytes(pathPayload, uint32(input.networkId)) : pathPayload;
  const response = await exchange(
    input.transport,
    INS_GET_PUBLIC_KEY,
    input.display ? 1 : 0,
    input.display ? 1 : 0,
    payload,
  );
  const publicKeyLength = response[0];
  if (!publicKeyLength) throw coreError('missing public key length');
  const publicKey = bytesToHex(response.slice(1, 1 + publicKeyLength));
  const coreAddress = publicKeyToAddress({ publicKey, networkId: input.networkId });
  const address = base32AddressToHex({ address: coreAddress as never }) as Address;
  return { address, coreAddress, publicKey };
}

export async function signCoreLedgerTransaction(input: {
  transport: LedgerTransportLike;
  path: string;
  tx: SignableTx;
}): Promise<Hex> {
  const unsigned = serializeCoreTransaction(input.tx);
  const path = encodePath(input.path);
  const txBytes = hexToBytes(unsigned);
  const response = await exchangeChunks(input.transport, INS_SIGN_TX, path, txBytes);
  return finaliseCoreTransaction(input.tx, parseLedgerSignature(response));
}

export async function signCoreLedgerMessage(input: {
  transport: LedgerTransportLike;
  path: string;
  chainId: number;
  message: string | Uint8Array;
}): Promise<Hex> {
  const message =
    typeof input.message === 'string' ? new TextEncoder().encode(input.message) : input.message;
  const path = encodePath(input.path);
  const response = await exchangeChunks(input.transport, INS_SIGN_PERSONAL, path, message);
  return signatureToHex(parseLedgerSignature(response));
}

function coreError(message: string): KeystoreError {
  return new KeystoreError({ code: 'services/keystore/ledger/core-apdu-error', message });
}
