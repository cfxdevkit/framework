import { describe, expect, it } from 'vitest';
import { WalletError } from '../errors/index.js';
import { signerFromPrivateKey } from './index.js';

// Hardcoded Core key for signing tests.
const TEST_CORE_KEY =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80' as `0x${string}`;

/** Minimal valid fields shared by all Core Space tx types. */
const REQUIRED: Pick<
  import('./index.js').SignableTx,
  'chainId' | 'nonce' | 'gas' | 'storageLimit' | 'epochHeight'
> = {
  chainId: 1,
  nonce: 0,
  gas: 21_000n,
  storageLimit: 0n,
  epochHeight: 0n,
};

describe('signCoreTransaction / missing required fields', () => {
  const signer = signerFromPrivateKey(TEST_CORE_KEY, { family: 'core', coreNetworkId: 1 });
  const coreAddress = 'cfxtest:aak39z1fdm02v71y33znvaxwthh99skcp2s48zasbp';

  it('throws WalletError when epochHeight is missing', async () => {
    const { epochHeight: _eh, ...tx } = REQUIRED;
    await expect(signer.signTransaction({ ...tx, to: coreAddress, gasPrice: 1n })).rejects.toThrow(
      WalletError,
    );
  });

  it('throws WalletError when nonce is missing', async () => {
    const { nonce: _n, ...tx } = REQUIRED;
    await expect(signer.signTransaction({ ...tx, to: coreAddress, gasPrice: 1n })).rejects.toThrow(
      WalletError,
    );
  });

  it('throws WalletError when gas is missing', async () => {
    const { gas: _g, ...tx } = REQUIRED;
    await expect(signer.signTransaction({ ...tx, to: coreAddress, gasPrice: 1n })).rejects.toThrow(
      WalletError,
    );
  });

  it('throws WalletError when storageLimit is missing', async () => {
    const { storageLimit: _sl, ...tx } = REQUIRED;
    await expect(signer.signTransaction({ ...tx, to: coreAddress, gasPrice: 1n })).rejects.toThrow(
      WalletError,
    );
  });
});

describe('signCoreTransaction / type-specific validation', () => {
  const signer = signerFromPrivateKey(TEST_CORE_KEY, { family: 'core', coreNetworkId: 1 });
  const coreAddress = 'cfxtest:aak39z1fdm02v71y33znvaxwthh99skcp2s48zasbp';

  it('throws WalletError for cip1559 when maxFeePerGas is missing', async () => {
    await expect(
      signer.signTransaction({
        ...REQUIRED,
        to: coreAddress,
        coreType: 'cip1559',
        maxPriorityFeePerGas: 1n,
      }),
    ).rejects.toThrow(WalletError);
  });

  it('throws WalletError for cip1559 when maxPriorityFeePerGas is missing', async () => {
    await expect(
      signer.signTransaction({
        ...REQUIRED,
        to: coreAddress,
        coreType: 'cip1559',
        maxFeePerGas: 1n,
      }),
    ).rejects.toThrow(WalletError);
  });

  it('throws WalletError for legacy when gasPrice is missing', async () => {
    await expect(
      signer.signTransaction({
        ...REQUIRED,
        to: coreAddress,
        coreType: 'legacy',
      }),
    ).rejects.toThrow(WalletError);
  });

  it('throws WalletError for cip2930 (default) when gasPrice is missing', async () => {
    await expect(
      signer.signTransaction({
        ...REQUIRED,
        to: coreAddress,
      }),
    ).rejects.toThrow(WalletError);
  });
});

describe('signCoreTransaction / success', () => {
  const signer = signerFromPrivateKey(TEST_CORE_KEY, { family: 'core', coreNetworkId: 1 });
  const coreAddress = signer.account.address;

  it('signs a legacy Core Space transaction', async () => {
    const sig = await signer.signTransaction({
      ...REQUIRED,
      to: coreAddress,
      value: 0n,
      coreType: 'legacy',
      gasPrice: 1_000_000_000n,
    });
    expect(sig).toMatch(/^0x[0-9a-f]+$/i);
  });

  it('signs a cip2930 Core Space transaction', async () => {
    const sig = await signer.signTransaction({
      ...REQUIRED,
      to: coreAddress,
      value: 0n,
      coreType: 'cip2930',
      gasPrice: 1_000_000_000n,
    });
    expect(sig).toMatch(/^0x[0-9a-f]+$/i);
  });

  it('signs a cip1559 Core Space transaction', async () => {
    const sig = await signer.signTransaction({
      ...REQUIRED,
      to: coreAddress,
      value: 0n,
      coreType: 'cip1559',
      maxFeePerGas: 1_000_000_000n,
      maxPriorityFeePerGas: 1_000_000_000n,
    });
    expect(sig).toMatch(/^0x[0-9a-f]+$/i);
  });
});
