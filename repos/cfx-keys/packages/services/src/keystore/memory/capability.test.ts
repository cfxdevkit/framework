import type { Signer } from '@cfxdevkit/core';
import { KeystoreError } from '@cfxdevkit/core';
import type { SignableTx } from '@cfxdevkit/core/wallet';
import { describe, expect, it } from 'vitest';
import { applyCapability } from './capability.js';

const hex = (byte: string, repeats: number): `0x${string}` => `0x${byte.repeat(repeats)}`;
const zeroAddress = hex('00', 20);
const zeroSignature = hex('00', 65);
const zeroRawTx = hex('00', 100);

function baseSigner(overrides: Partial<Signer> = {}): Signer {
  return {
    account: { address: zeroAddress },
    signMessage: async () => zeroSignature,
    signTypedData: async () => zeroSignature,
    signTransaction: async () => zeroRawTx,
    ...overrides,
  };
}

describe('applyCapability', () => {
  it('delegates signMessage unchanged', async () => {
    const base = baseSigner();
    const capped = applyCapability(base, { chains: [1] });
    const msg = 'hello';
    const sig = await capped.signMessage(msg);
    expect(sig).toBe(zeroSignature);
  });

  it('delegates signTypedData unchanged', async () => {
    const base = baseSigner();
    const capped = applyCapability(base, { chains: [1] });
    const sig = await capped.signTypedData({});
    expect(sig).toBe(zeroSignature);
  });

  it('blocks transaction when capability expired', async () => {
    const base = baseSigner();
    const capped = applyCapability(base, { notAfter: Date.now() - 1000 });
    const tx: SignableTx = {
      chainId: 1,
      to: hex('11', 20),
      value: 1000n,
      data: '0x',
    };
    await expect(capped.signTransaction(tx)).rejects.toBeInstanceOf(KeystoreError);
    await expect(capped.signTransaction(tx)).rejects.toMatchObject({
      code: 'services/keystore/unsupported',
      message: 'capability expired',
    });
  });

  it('blocks transaction when chainId not permitted', async () => {
    const base = baseSigner();
    const capped = applyCapability(base, { chains: [1] });
    const tx: SignableTx = {
      chainId: 10,
      to: hex('11', 20),
      value: 1000n,
      data: '0x',
    };
    await expect(capped.signTransaction(tx)).rejects.toBeInstanceOf(KeystoreError);
    await expect(capped.signTransaction(tx)).rejects.toMatchObject({
      code: 'services/keystore/unsupported',
      message: 'chainId 10 not permitted by capability',
    });
  });

  it('blocks transaction when target contract not permitted', async () => {
    const base = baseSigner();
    const capped = applyCapability(base, {
      contracts: [hex('aa', 20)],
    });
    const tx: SignableTx = {
      chainId: 1,
      to: hex('bb', 20),
      value: 1000n,
      data: '0x',
    };
    await expect(capped.signTransaction(tx)).rejects.toBeInstanceOf(KeystoreError);
    await expect(capped.signTransaction(tx)).rejects.toMatchObject({
      code: 'services/keystore/unsupported',
      message: 'target 0xbb... not permitted by capability',
    });
  });

  it('blocks transaction when function selector not permitted', async () => {
    const base = baseSigner();
    const capped = applyCapability(base, { selectors: ['0x12345678'] });
    const tx: SignableTx = {
      chainId: 1,
      to: hex('aa', 20),
      value: 1000n,
      data: `0x98765432${'00'.repeat(28)}`,
    };
    await expect(capped.signTransaction(tx)).rejects.toBeInstanceOf(KeystoreError);
    await expect(capped.signTransaction(tx)).rejects.toMatchObject({
      code: 'services/keystore/unsupported',
      message: 'selector 0x98765432 not permitted by capability',
    });
  });

  it('blocks transaction when value exceeds capability max', async () => {
    const base = baseSigner();
    const capped = applyCapability(base, { maxValuePerTx: 1000n });
    const tx: SignableTx = {
      chainId: 1,
      to: hex('aa', 20),
      value: 2000n,
      data: '0x',
    };
    await expect(capped.signTransaction(tx)).rejects.toBeInstanceOf(KeystoreError);
    await expect(capped.signTransaction(tx)).rejects.toMatchObject({
      code: 'services/keystore/unsupported',
      message: 'tx value 2000 exceeds capability max 1000',
    });
  });

  it('allows transaction when all capability constraints pass', async () => {
    const signedTx = `0x${'00'.repeat(65)}01` as `0x${string}`;
    const base = baseSigner({ signTransaction: async () => signedTx });
    const capped = applyCapability(base, {
      chains: [1],
      contracts: [hex('aa', 20)],
      selectors: ['0x12345678'],
      maxValuePerTx: 2000n,
    });
    const tx: SignableTx = {
      chainId: 1,
      to: hex('aa', 20),
      value: 1000n,
      data: `0x12345678${'00'.repeat(28)}`,
    };
    const sig = await capped.signTransaction(tx);
    expect(sig).toBe(signedTx);
  });
});
