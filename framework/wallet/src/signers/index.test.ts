import { deriveAccount } from '@cfxdevkit/core/wallet';
import { createMemoryKeystore } from '@cfxdevkit/services/keystore-memory';
import { describe, expect, it } from 'vitest';
import { SessionKeyError } from '../errors/index.js';
import { readonlySigner, signerFromKeystore } from './index.js';

const TEST_MNEMONIC = 'test test test test test test test test test test test junk';

describe('signerFromKeystore', () => {
  it('produces a Signer bound to the keystore-stored account', async () => {
    const { account, privateKey } = deriveAccount({
      mnemonic: TEST_MNEMONIC,
      path: "m/44'/60'/0'/0/0",
    });
    const provider = createMemoryKeystore({
      seed: [{ ref: { service: 's', account: 'a' }, privateKey }],
    });
    const signer = await signerFromKeystore({ provider, ref: { service: 's', account: 'a' } });
    expect(signer.account.address).toBe(account.address);
    const sig = await signer.signMessage('hello');
    expect(sig).toMatch(/^0x[0-9a-f]{130}$/);
  });

  it('forwards capability into the provider', async () => {
    const { privateKey } = deriveAccount({
      mnemonic: TEST_MNEMONIC,
      path: "m/44'/60'/0'/0/0",
    });
    const provider = createMemoryKeystore({
      seed: [{ ref: { service: 's', account: 'a' }, privateKey }],
    });
    const signer = await signerFromKeystore({
      provider,
      ref: { service: 's', account: 'a' },
      capability: { chains: [42] },
    });
    await expect(
      signer.signTransaction({
        chainId: 71,
        to: '0x0000000000000000000000000000000000000001',
        nonce: 0,
        gas: 21000n,
        maxFeePerGas: 1n,
        maxPriorityFeePerGas: 1n,
      }),
    ).rejects.toThrow();
  });
});

describe('readonlySigner', () => {
  it('exposes the address but every sign* call throws', async () => {
    const signer = readonlySigner('0x0000000000000000000000000000000000000001');
    expect(signer.account.address).toBe('0x0000000000000000000000000000000000000001');
    await expect(signer.signMessage('x')).rejects.toBeInstanceOf(SessionKeyError);
    await expect(
      signer.signTransaction({
        chainId: 1,
        nonce: 0,
        gas: 21000n,
        maxFeePerGas: 1n,
        maxPriorityFeePerGas: 1n,
      }),
    ).rejects.toBeInstanceOf(SessionKeyError);
  });
});
