import { type Hex, KeystoreError } from '@cfxdevkit/cdk';
import type { LedgerSignature, LedgerTransportLike } from '../types.js';

const CLA = 0xe0;
const FIRST = 0x00;
const OK = 0x9000;
const MAX_APDU_DATA = 255;
const LEGACY_MORE = 0x80;
const P2_LAST = 0x00;
const P2_MORE = 0x80;
const STATUS_HINTS: Record<number, string> = {
  21781:
    'Ledger is locked or not ready. Unlock the device, open the Conflux Core app, then retry from the app button.',
  25870: 'Open the Conflux Core app on Ledger and unlock the device.',
  27013: 'The operation was rejected on the Ledger device.',
  27157: 'Wrong Ledger app for the selected chain. Open Conflux Core for Core Space.',
  27270:
    'The Conflux Core app rejected the APDU parameters. Disconnect/reconnect, make sure Conflux Core is open, and retry. If this repeats, update the Ledger Conflux app.',
  27271:
    'The Conflux Core app rejected the payload length. Disconnect/reconnect, then retry the operation.',
  28163:
    'The Conflux Core app rejected the APDU length. For address display, reconnect and retry so the app can send the required network id.',
  45061:
    'The Conflux Core app could not parse this transaction. Use a simple Core transfer first; contract calls require blind signing enabled in the Ledger app settings.',
  45063:
    'The Conflux Core app is busy with a previous signing flow. Reject or finish it on the device, then retry.',
  45064: 'The Conflux Core app failed to sign. Reopen the app on Ledger and retry.',
};

export async function exchangeChunks(
  transport: LedgerTransportLike,
  ins: number,
  prefix: Uint8Array,
  data: Uint8Array,
): Promise<Uint8Array<ArrayBufferLike>> {
  await exchange(transport, ins, FIRST, P2_MORE, prefix);
  let offset = 0;
  let chunkIndex = 1;
  let response: Uint8Array<ArrayBufferLike> = new Uint8Array();
  do {
    if (chunkIndex > 0xff) throw coreError('APDU chunk index exceeds 255');
    const chunk = data.slice(offset, offset + MAX_APDU_DATA);
    offset += chunk.length;
    const p2 = offset < data.length ? P2_MORE : P2_LAST;
    response = await exchange(transport, ins, chunkIndex, p2, chunk);
    chunkIndex++;
  } while (offset < data.length);
  return response;
}

export async function exchangeLegacyChunks(
  transport: LedgerTransportLike,
  ins: number,
  prefix: Uint8Array,
  data: Uint8Array,
): Promise<Uint8Array<ArrayBufferLike>> {
  let offset = 0;
  let first = true;
  let response: Uint8Array<ArrayBufferLike> = new Uint8Array();
  while (first || offset < data.length) {
    const available = MAX_APDU_DATA - (first ? prefix.length : 0);
    if (available <= 0) throw coreError('APDU prefix exceeds 255 bytes');
    const chunk = data.slice(offset, offset + available);
    const payload = first ? concatBytes(prefix, chunk) : chunk;
    response = await exchange(transport, ins, first ? FIRST : LEGACY_MORE, P2_LAST, payload);
    offset += chunk.length;
    first = false;
  }
  return response;
}

export async function exchange(
  transport: LedgerTransportLike,
  ins: number,
  p1: number,
  p2: number,
  data: Uint8Array,
): Promise<Uint8Array<ArrayBufferLike>> {
  if (data.length > MAX_APDU_DATA) throw coreError('APDU payload exceeds 255 bytes');
  if (transport.send) {
    try {
      // transport.send() validates the status word internally and returns data WITHOUT it
      return toUint8(await transport.send(CLA, ins, p1, p2, toTransportBytes(data), [OK]));
    } catch (cause) {
      const status = statusFromTransportError(cause);
      if (status === 0x6a86) return exchangeRaw(transport, ins, p1, p2, data);
      if (status !== undefined) throw coreError(formatStatusError(status));
      throw cause;
    }
  }
  return exchangeRaw(transport, ins, p1, p2, data);
}

async function exchangeRaw(
  transport: LedgerTransportLike,
  ins: number,
  p1: number,
  p2: number,
  data: Uint8Array,
): Promise<Uint8Array<ArrayBufferLike>> {
  const request = concatBytes(new Uint8Array([CLA, ins, p1, p2, data.length]), data);
  const apdu = { ins, p1, p2, length: data.length };
  try {
    return stripStatusWord(toUint8(await transport.exchange(toTransportBytes(request))), apdu);
  } catch (cause) {
    const status = statusFromTransportError(cause);
    if (status !== undefined) throw coreError(formatStatusError(status, apdu));
    throw cause;
  }
}

export function encodePath(path: string): Uint8Array {
  const segments = path.replace(/^m\//, '').split('/').filter(Boolean);
  if (segments.length > 10) throw coreError('Ledger paths support at most 10 segments');
  const out = new Uint8Array(1 + segments.length * 4);
  out[0] = segments.length;
  for (let index = 0; index < segments.length; index++) {
    const raw = segments[index] ?? '';
    const hardened = raw.endsWith("'");
    const value = Number.parseInt(hardened ? raw.slice(0, -1) : raw, 10);
    if (!Number.isSafeInteger(value) || value < 0)
      throw coreError(`invalid derivation path segment ${raw}`);
    writeUint32(out, 1 + index * 4, hardened ? value | 0x80000000 : value);
  }
  return out;
}

export function parseLedgerSignature(response: Uint8Array): LedgerSignature {
  if (response.length === 67) {
    const status = ((response[65] ?? 0) << 8) | (response[66] ?? 0);
    if (status === OK) return parseLedgerSignature(response.slice(0, 65));
  }
  if (response.length !== 65) throw coreError(`expected 65-byte signature, got ${response.length}`);
  return {
    v: response[0] ?? 0,
    r: bytesToHex(response.slice(1, 33)),
    s: bytesToHex(response.slice(33, 65)),
  };
}

export function signatureToHex(sig: LedgerSignature): Hex {
  let v = sig.v;
  if (v === 0 || v === 1) v += 27;
  return `0x${stripHex(sig.r)}${stripHex(sig.s)}${v.toString(16).padStart(2, '0')}` as Hex;
}

export function uint32(value: number): Uint8Array {
  const out = new Uint8Array(4);
  writeUint32(out, 0, value);
  return out;
}

export function hexToBytes(hex: Hex): Uint8Array {
  const stripped = stripHex(hex);
  const out = new Uint8Array(stripped.length / 2);
  for (let index = 0; index < out.length; index++) {
    out[index] = Number.parseInt(stripped.slice(index * 2, index * 2 + 2), 16);
  }
  return out;
}

export function bytesToHex(bytes: Uint8Array): Hex {
  let hex = '';
  for (const byte of bytes) hex += byte.toString(16).padStart(2, '0');
  return `0x${hex}` as Hex;
}

export function concatBytes(...parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

function writeUint32(out: Uint8Array, offset: number, value: number): void {
  out[offset] = (value >>> 24) & 0xff;
  out[offset + 1] = (value >>> 16) & 0xff;
  out[offset + 2] = (value >>> 8) & 0xff;
  out[offset + 3] = value & 0xff;
}

function toUint8(value: Uint8Array | Buffer): Uint8Array<ArrayBufferLike> {
  return value instanceof Uint8Array ? value : new Uint8Array(value);
}

function stripHex(value: string): string {
  return value.startsWith('0x') || value.startsWith('0X') ? value.slice(2) : value;
}

function toTransportBytes(data: Uint8Array): Uint8Array | Buffer {
  return typeof Buffer === 'undefined' ? data : Buffer.from(data);
}

function statusFromTransportError(cause: unknown): number | undefined {
  if (!cause || typeof cause !== 'object') return undefined;
  const maybe = cause as { message?: unknown; statusCode?: unknown; status?: unknown };
  const status = maybe.statusCode ?? maybe.status;
  if (typeof status === 'number') return status;
  if (typeof status === 'string') return Number.parseInt(stripHex(status), 16);
  if (typeof maybe.message === 'string') return statusFromMessage(maybe.message);
  return undefined;
}

function statusFromMessage(message: string): number | undefined {
  const match = /0x([0-9a-f]{4})/i.exec(message);
  return match ? Number.parseInt(match[1] ?? '', 16) : undefined;
}

function stripStatusWord(
  response: Uint8Array,
  apdu: { ins: number; p1: number; p2: number; length: number },
): Uint8Array<ArrayBufferLike> {
  if (response.length < 2) throw coreError('missing status word');
  const status = ((response[response.length - 2] ?? 0) << 8) | (response[response.length - 1] ?? 0);
  if (status !== OK) throw coreError(formatStatusError(status, apdu));
  return response.slice(0, -2);
}

function formatStatusError(
  status: number,
  apdu?: { ins: number; p1: number; p2: number; length: number },
): string {
  const statusHex = `0x${status.toString(16).padStart(4, '0')}`;
  const details = apdu
    ? ` (ins=0x${apdu.ins.toString(16).padStart(2, '0')}, p1=0x${apdu.p1.toString(16).padStart(2, '0')}, p2=0x${apdu.p2.toString(16).padStart(2, '0')}, lc=${apdu.length})`
    : '';
  const hint = STATUS_HINTS[status];
  if (status === 0x6a86 && apdu?.ins === 0x04) {
    return `Ledger Core app returned status ${statusHex}${details}: The published Conflux Core app does not expose INS=0x04 personal-signing in version 2.2.2. Core transaction signing still uses INS=0x03 with the current chunked APDU flow.`;
  }
  return hint
    ? `Ledger Core app returned status ${statusHex}${details}: ${hint}`
    : `Ledger Core app returned status ${statusHex}${details}`;
}

function coreError(message: string): KeystoreError {
  return new KeystoreError({ code: 'services/keystore/ledger/core-apdu-error', message });
}
