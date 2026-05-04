import type { Hex } from 'viem';
import { describe, expect, it } from 'vitest';
import { HardwareWalletError } from '../errors/index.js';
import {
  EVM_DEFAULT_PATH,
  finaliseEip1559Tx,
  HARDWARE_WALLET_KINDS,
  rawSignatureToHex,
  toCanonicalHex,
} from './types.js';

const hex32 = (byte: string): Hex => `0x${byte.repeat(32)}`;

describe('EVM_DEFAULT_PATH', () => {
  it('is the standard Conflux eSpace derivation path', () => {
    expect(EVM_DEFAULT_PATH).toBe("m/44'/60'/0'/0/0");
  });
});

describe('HARDWARE_WALLET_KINDS', () => {
  it('includes Ledger in the supported hardware backend list', () => {
    expect(HARDWARE_WALLET_KINDS).toEqual(['ledger', 'onekey', 'satochip']);
  });
});

describe('toCanonicalHex', () => {
  it('adds 0x prefix to unprefixed hex', () => {
    expect(toCanonicalHex('deadbeef')).toBe('0xdeadbeef');
  });
  it('preserves existing 0x prefix', () => {
    expect(toCanonicalHex('0xdeadbeef')).toBe('0xdeadbeef');
  });
  it('lowercases hex digits', () => {
    expect(toCanonicalHex('0xDEADBEEF')).toBe('0xdeadbeef');
  });
  it('throws on non-hex input', () => {
    expect(() => toCanonicalHex('0xGHI')).toThrow(HardwareWalletError);
  });
});

describe('rawSignatureToHex', () => {
  it('formats valid (r,s,v=27) as 65-byte hex', () => {
    const sig = hex32('01');
    const result = rawSignatureToHex({ r: sig, s: sig, v: 27 });
    expect(result).toMatch(/^0x[0-9a-f]{130}$/);
    expect(result).toBe(`0x${'01'.repeat(32)}${'01'.repeat(32)}1b`);
  });
  it('normalises v=0 to v=27', () => {
    const sig = hex32('02');
    const result = rawSignatureToHex({ r: sig, s: sig, v: 0 });
    expect(result.slice(-2)).toBe('1b');
  });
  it('normalises v=1 to v=28', () => {
    const sig = hex32('03');
    const result = rawSignatureToHex({ r: sig, s: sig, v: 1 });
    expect(result.slice(-2)).toBe('1c');
  });
  it('throws on r/s shorter than 32 bytes', () => {
    expect(() => rawSignatureToHex({ r: '0x01', s: '0x02', v: 27 })).toThrow(HardwareWalletError);
  });
  it('throws on invalid v value', () => {
    expect(() => rawSignatureToHex({ r: '0x01'.repeat(32), s: '0x02'.repeat(32), v: 5 })).toThrow(
      HardwareWalletError,
    );
  });
});

describe('finaliseEip1559Tx', () => {
  it('serialises a complete EIP-1559 transaction', () => {
    const tx = {
      chainId: 1030n,
      to: '0x3333333333333333333333333333333333333333' as `0x${string}`,
      value: 1n,
      nonce: 0n,
      gas: 21_000n,
      maxFeePerGas: 1_000_000_000n,
      maxPriorityFeePerGas: 1_000_000_000n,
      type: 2,
    };
    const r = hex32('01');
    const s = hex32('02');
    const result = finaliseEip1559Tx(tx, { r, s, v: 0 });
    expect(result).toMatch(/^0x02[0-9a-f]+$/);
  });
  it('accepts v=27/28 and normalises internally', () => {
    const tx = {
      chainId: 1030n,
      to: '0x3333333333333333333333333333333333333333' as `0x${string}`,
      value: 1n,
      nonce: 0n,
      gas: 21_000n,
      maxFeePerGas: 1_000_000_000n,
      maxPriorityFeePerGas: 1_000_000_000n,
      type: 2,
    };
    const r = hex32('01');
    const s = hex32('02');
    const result = finaliseEip1559Tx(tx, { r, s, v: 28 });
    expect(result).toMatch(/^0x02[0-9a-f]+$/);
  });
  it('throws on invalid v parity', () => {
    const tx = {
      chainId: 1030n,
      to: '0x3333333333333333333333333333333333333333' as `0x${string}`,
      value: 1n,
      nonce: 0n,
      gas: 21_000n,
      maxFeePerGas: 1_000_000_000n,
      maxPriorityFeePerGas: 1_000_000_000n,
      type: 2,
    };
    expect(() => finaliseEip1559Tx(tx, { r: '0x01', s: '0x02', v: 5 })).toThrow(
      HardwareWalletError,
    );
  });
});
