import { describe, expect, it } from 'vitest';
import {
  concatBytes,
  encodePath,
  exchange,
  exchangeChunks,
  exchangeLegacyChunks,
  parseLedgerSignature,
  uint32,
} from './core-framing.js';
import type { LedgerTransportLike } from './types.js';

function statusTransport(status: number): LedgerTransportLike {
  return {
    async exchange() {
      return new Uint8Array([(status >>> 8) & 0xff, status & 0xff]);
    },
  };
}

function hexBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let index = 0; index < out.length; index++) {
    out[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16);
  }
  return out;
}

function bytesHex(bytes: Uint8Array): string {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

describe('Ledger Core APDU status mapping', () => {
  it('explains the app-not-open status', async () => {
    await expect(exchange(statusTransport(0x650e), 0x04, 0, 0, new Uint8Array())).rejects.toThrow(
      'Open the Conflux Core app',
    );
  });

  it('explains wrong-app statuses', async () => {
    await expect(exchange(statusTransport(0x6a15), 0x04, 0, 0, new Uint8Array())).rejects.toThrow(
      'Wrong Ledger app',
    );
  });

  it('explains wrong APDU length status', async () => {
    await expect(exchange(statusTransport(0x6e03), 0x04, 0, 0, new Uint8Array())).rejects.toThrow(
      'rejected the APDU length',
    );
  });

  it('explains rejected APDU parameters', async () => {
    await expect(exchange(statusTransport(0x6a86), 0x04, 0, 0, new Uint8Array())).rejects.toThrow(
      'does not expose INS=0x04 personal-signing in version 2.2.2',
    );
  });

  it('explains locked or not-ready device status', async () => {
    await expect(exchange(statusTransport(0x5515), 0x04, 0, 0, new Uint8Array())).rejects.toThrow(
      'Ledger is locked or not ready',
    );
  });

  it('uses Ledger send when available', async () => {
    // transport.send() strips the status word itself and returns data only (LedgerJS contract)
    const transport: LedgerTransportLike & { call?: unknown[] } = {
      async exchange() {
        throw new Error('raw exchange should not be used');
      },
      async send(...call) {
        transport.call = call;
        return hexBytes('010203'); // no status word — send() already handles that
      },
    };

    await expect(exchange(transport, 0x04, 0, 0, hexBytes('aa'))).resolves.toEqual(
      hexBytes('010203'),
    );
    expect(transport.call).toEqual([0xe0, 0x04, 0x00, 0x00, expect.any(Uint8Array), [0x9000]]);
    expect(bytesHex(transport.call?.[4] as Uint8Array)).toBe('aa');
  });

  it('accepts signature responses with a trailing OK status word', () => {
    const response = hexBytes(`00${'11'.repeat(32)}${'22'.repeat(32)}9000`);

    expect(parseLedgerSignature(response)).toEqual({
      v: 0,
      r: `0x${'11'.repeat(32)}`,
      s: `0x${'22'.repeat(32)}`,
    });
  });

  it('maps raw exchange status errors with APDU details', async () => {
    const transport: LedgerTransportLike = {
      async exchange() {
        throw { statusCode: 0x6a86 };
      },
    };

    await expect(exchange(transport, 0x04, 0, 0, hexBytes('aa'))).rejects.toThrow(
      'ins=0x04, p1=0x00, p2=0x00, lc=1',
    );
  });

  it('falls back to raw APDU exchange when Ledger send rejects sign parameters', async () => {
    const calls: Uint8Array[] = [];
    const transport: LedgerTransportLike = {
      async exchange(apdu) {
        calls.push(new Uint8Array(apdu));
        return hexBytes('0102039000');
      },
      async send() {
        throw { statusCode: 0x6a86 };
      },
    };

    await expect(exchange(transport, 0x04, 0, 0, hexBytes('aa'))).resolves.toEqual(
      hexBytes('010203'),
    );
    expect(bytesHex(calls[0] ?? new Uint8Array())).toBe('e004000001aa');
  });

  it('falls back when LedgerJS only reports the status in the error message', async () => {
    const calls: Uint8Array[] = [];
    const transport: LedgerTransportLike = {
      async exchange(apdu) {
        calls.push(new Uint8Array(apdu));
        return hexBytes('0102039000');
      },
      async send() {
        throw new Error('Ledger device: UNKNOWN_ERROR (0x6a86)');
      },
    };

    await expect(exchange(transport, 0x04, 0, 0, hexBytes('aa'))).resolves.toEqual(
      hexBytes('010203'),
    );
    expect(bytesHex(calls[0] ?? new Uint8Array())).toBe('e004000001aa');
  });

  it('matches the app-conflux SIGN_PERSONAL APDU sequence', async () => {
    const calls: Uint8Array[] = [];
    const transport: LedgerTransportLike = {
      async exchange(apdu) {
        calls.push(new Uint8Array(apdu));
        return hexBytes('9000');
      },
    };
    const message = new TextEncoder().encode('Hello, World');
    const prefix = encodePath("m/44'/503'/0'/0/0");

    await exchangeChunks(transport, 0x04, prefix, message);

    expect(bytesHex(calls[0] ?? new Uint8Array())).toBe(
      'e004008015058000002c800001f7800000000000000000000000',
    );
    expect(bytesHex(calls[1] ?? new Uint8Array())).toBe('e00401000c48656c6c6f2c20576f726c64');
  });

  it('matches the legacy SIGN_PERSONAL APDU sequence', async () => {
    const calls: Uint8Array[] = [];
    const transport: LedgerTransportLike = {
      async exchange(apdu) {
        calls.push(new Uint8Array(apdu));
        return hexBytes('9000');
      },
    };
    const message = new TextEncoder().encode('Hello, world!');
    const prefix = concatBytes(
      encodePath("m/44'/503'/0'/0/0"),
      uint32(1029),
      uint32(message.length),
    );

    await exchangeLegacyChunks(transport, 0x04, prefix, message);

    expect(bytesHex(calls[0] ?? new Uint8Array())).toBe(
      'e00400002a058000002c800001f7800000000000000000000000000004050000000d48656c6c6f2c20776f726c6421',
    );
  });

  it('matches the app-conflux SIGN_TX APDU sequence', async () => {
    const calls: Uint8Array[] = [];
    const transport: LedgerTransportLike = {
      async exchange(apdu) {
        calls.push(new Uint8Array(apdu));
        return hexBytes('9000');
      },
    };
    const tx = hexBytes(
      'eb1284561f61b9831e84809410109fc8df283027b6285cc889f5aa624eac1f55843b9aca0081800182040580',
    );

    await exchangeChunks(transport, 0x03, encodePath("m/44'/503'/0'/0/0"), tx);

    expect(bytesHex(calls[0] ?? new Uint8Array())).toBe(
      'e003008015058000002c800001f7800000000000000000000000',
    );
    expect(bytesHex(calls[1] ?? new Uint8Array())).toBe(
      'e00301002ceb1284561f61b9831e84809410109fc8df283027b6285cc889f5aa624eac1f55843b9aca0081800182040580',
    );
  });
});
