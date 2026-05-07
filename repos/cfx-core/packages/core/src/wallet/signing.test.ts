import { describe, expect, it } from 'vitest';
import { WalletError } from '../errors/index.js';
import { coreAddressFromPrivateKey, DEFAULT_CORE_PATH, deriveAccount } from './derivation.js';
import type { SignableTx } from './index.js';
import { signCoreTransaction } from './signing.js';

const TEST_MNEMONIC = 'test test test test test test test test test test test junk';

const { privateKey } = deriveAccount({ mnemonic: TEST_MNEMONIC, path: DEFAULT_CORE_PATH });
// Use a valid cfxtest: address so cive accepts it as `to`
const CFXTEST_ADDRESS = coreAddressFromPrivateKey(privateKey, 1);

/** Minimal valid fields shared by all Core Space tx types. */
const REQUIRED: Pick<SignableTx, 'chainId' | 'nonce' | 'gas' | 'storageLimit' | 'epochHeight'> = {
  chainId: 1,
  nonce: 0,
  gas: 21_000n,
  storageLimit: 0n,
  epochHeight: 0n,
};

describe('signCoreTransaction / missing required fields', () => {
  it('throws WalletError when epochHeight is missing', async () => {
    const { epochHeight: _eh, ...tx } = REQUIRED;
    await expect(
      signCoreTransaction(privateKey, { ...tx, to: CFXTEST_ADDRESS, gasPrice: 1n }),
    ).rejects.toThrow(WalletError);
  });

  it('throws WalletError when nonce is missing', async () => {
    const { nonce: _n, ...tx } = REQUIRED;
    await expect(
      signCoreTransaction(privateKey, { ...tx, to: CFXTEST_ADDRESS, gasPrice: 1n }),
    ).rejects.toThrow(WalletError);
  });

  it('throws WalletError when gas is missing', async () => {
    const { gas: _g, ...tx } = REQUIRED;
    await expect(
      signCoreTransaction(privateKey, { ...tx, to: CFXTEST_ADDRESS, gasPrice: 1n }),
    ).rejects.toThrow(WalletError);
  });

  it('throws WalletError when storageLimit is missing', async () => {
    const { storageLimit: _sl, ...tx } = REQUIRED;
    await expect(
      signCoreTransaction(privateKey, { ...tx, to: CFXTEST_ADDRESS, gasPrice: 1n }),
    ).rejects.toThrow(WalletError);
  });
});

describe('signCoreTransaction / type-specific validation', () => {
  it('throws WalletError for cip1559 when maxFeePerGas is missing', async () => {
    await expect(
      signCoreTransaction(privateKey, {
        ...REQUIRED,
        coreType: 'cip1559',
        maxPriorityFeePerGas: 1n,
      }),
    ).rejects.toThrow(WalletError);
  });

  it('throws WalletError for cip1559 when maxPriorityFeePerGas is missing', async () => {
    await expect(
      signCoreTransaction(privateKey, {
        ...REQUIRED,
        coreType: 'cip1559',
        maxFeePerGas: 1n,
      }),
    ).rejects.toThrow(WalletError);
  });

  it('throws WalletError for legacy when gasPrice is missing', async () => {
    await expect(
      signCoreTransaction(privateKey, { ...REQUIRED, coreType: 'legacy' }),
    ).rejects.toThrow(WalletError);
  });

  it('throws WalletError for cip2930 (default) when gasPrice is missing', async () => {
    await expect(signCoreTransaction(privateKey, { ...REQUIRED })).rejects.toThrow(WalletError);
  });
});

describe('signCoreTransaction / success', () => {
  it('signs a legacy Core Space transaction', async () => {
    const sig = await signCoreTransaction(privateKey, {
      ...REQUIRED,
      to: CFXTEST_ADDRESS,
      value: 0n,
      coreType: 'legacy',
      gasPrice: 1_000_000_000n,
    });
    expect(sig).toMatch(/^0x[0-9a-f]+$/i);
  });

  it('signs a cip2930 Core Space transaction', async () => {
    const sig = await signCoreTransaction(privateKey, {
      ...REQUIRED,
      to: CFXTEST_ADDRESS,
      value: 0n,
      coreType: 'cip2930',
      gasPrice: 1_000_000_000n,
    });
    expect(sig).toMatch(/^0x[0-9a-f]+$/i);
  });

  it('signs a cip1559 Core Space transaction', async () => {
    const sig = await signCoreTransaction(privateKey, {
      ...REQUIRED,
      to: CFXTEST_ADDRESS,
      value: 0n,
      coreType: 'cip1559',
      maxFeePerGas: 1_000_000_000n,
      maxPriorityFeePerGas: 1_000_000_000n,
    });
    expect(sig).toMatch(/^0x[0-9a-f]+$/i);
  });

  it('produces deterministic output for the same inputs', async () => {
    const tx: SignableTx = {
      ...REQUIRED,
      to: CFXTEST_ADDRESS,
      value: 0n,
      coreType: 'legacy',
      gasPrice: 1_000_000_000n,
    };
    const sig1 = await signCoreTransaction(privateKey, tx);
    const sig2 = await signCoreTransaction(privateKey, tx);
    expect(sig1).toBe(sig2);
  });
});
