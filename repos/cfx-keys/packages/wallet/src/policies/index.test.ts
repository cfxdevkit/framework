import type { Address, Hex, SignableTx, Signer, TypedData } from '@cfxdevkit/core';
import type { Capability } from '@cfxdevkit/services/keystore';
import { describe, expect, it } from 'vitest';
import { SessionKeyError } from '../errors/index.js';
import { checkCapability, isEmptyCapability, withCapability } from './index.js';

const ADDR_A = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' as Address;
const ADDR_B = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' as Address;
const SIG: Hex = '0xdeadbeef';

function makeStubSigner(): Signer & { calls: string[] } {
  const calls: string[] = [];
  const signer = {
    account: { address: ADDR_A, publicKey: '0x' as Hex },
    async signTransaction(_tx: SignableTx): Promise<Hex> {
      calls.push('tx');
      return SIG;
    },
    async signMessage(_m: string | Uint8Array): Promise<Hex> {
      calls.push('msg');
      return SIG;
    },
    async signTypedData(_td: TypedData): Promise<Hex> {
      calls.push('typed');
      return SIG;
    },
    calls,
  };
  return signer as Signer & { calls: string[] };
}

const baseTx = (over: Partial<SignableTx> = {}): SignableTx => ({
  chainId: 1030,
  to: ADDR_B,
  value: 0n,
  data: '0xa9059cbb' as Hex,
  ...over,
});

describe('isEmptyCapability', () => {
  it('returns true for an unconstrained capability', () => {
    expect(isEmptyCapability({})).toBe(true);
  });

  it('returns false when any field is set', () => {
    expect(isEmptyCapability({ chains: [1] })).toBe(false);
    expect(isEmptyCapability({ maxValuePerTx: 0n })).toBe(false);
  });
});

describe('withCapability', () => {
  it('returns the inner signer when capability is empty', () => {
    const inner = makeStubSigner();
    expect(withCapability(inner, {})).toBe(inner);
    expect(withCapability(inner, undefined)).toBe(inner);
  });

  it('rejects mismatched chainId', async () => {
    const cap: Capability = { chains: [1] };
    const signer = withCapability(makeStubSigner(), cap);
    await expect(signer.signTransaction(baseTx())).rejects.toMatchObject({
      code: 'wallet/policies/chain-denied',
    });
  });

  it('rejects contract not in allowlist', async () => {
    const cap: Capability = { contracts: [ADDR_A] };
    const signer = withCapability(makeStubSigner(), cap);
    await expect(signer.signTransaction(baseTx())).rejects.toBeInstanceOf(SessionKeyError);
  });

  it('rejects selector not in allowlist', async () => {
    const cap: Capability = { selectors: ['0x12345678' as Hex] };
    const signer = withCapability(makeStubSigner(), cap);
    await expect(signer.signTransaction(baseTx())).rejects.toMatchObject({
      code: 'wallet/policies/selector-denied',
    });
  });

  it('rejects value exceeding cap', async () => {
    const cap: Capability = { maxValuePerTx: 100n };
    const signer = withCapability(makeStubSigner(), cap);
    await expect(signer.signTransaction(baseTx({ value: 101n }))).rejects.toMatchObject({
      code: 'wallet/policies/value-exceeded',
    });
    await expect(signer.signTransaction(baseTx({ value: 100n }))).resolves.toBe(SIG);
  });

  it('rejects expired capability', async () => {
    const cap: Capability = { notAfter: Date.now() - 1 };
    const signer = withCapability(makeStubSigner(), cap);
    await expect(signer.signMessage('hi')).rejects.toMatchObject({
      code: 'wallet/policies/expired',
    });
  });

  it('allows compliant transaction', async () => {
    const cap: Capability = {
      chains: [1030],
      contracts: [ADDR_B],
      selectors: ['0xa9059cbb' as Hex],
      maxValuePerTx: 0n,
    };
    const inner = makeStubSigner();
    const signer = withCapability(inner, cap);
    await expect(signer.signTransaction(baseTx())).resolves.toBe(SIG);
    expect(inner.calls).toEqual(['tx']);
  });

  it('rejects typed-data when domain.chainId is denied', async () => {
    const cap: Capability = { chains: [1030] };
    const signer = withCapability(makeStubSigner(), cap);
    const td = {
      domain: { chainId: 1 },
      types: {},
      primaryType: 'X',
      message: {},
    } as unknown as TypedData;
    await expect(signer.signTypedData(td)).rejects.toMatchObject({
      code: 'wallet/policies/typed-data-chain-denied',
    });
  });
});

describe('checkCapability', () => {
  it('returns null on allowed tx', () => {
    expect(checkCapability({ chains: [1030] }, baseTx())).toBeNull();
  });

  it('returns the SessionKeyError that withCapability would throw', () => {
    const err = checkCapability({ chains: [1] }, baseTx());
    expect(err).toBeInstanceOf(SessionKeyError);
    expect(err?.code).toBe('wallet/policies/chain-denied');
  });
});
