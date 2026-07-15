import { describe, expect, it } from 'vitest';
import { WalletError } from '../errors/index.js';
import {
  generateMnemonic,
  validateMnemonic,
  deriveAccount,
  deriveAccounts,
  deriveDualAccount,
  deriveDualAccounts,
  signerFromPrivateKey,
  signerFromMnemonic,
  signerFromDualMnemonic,
  accountFromPrivateKey,
  DEFAULT_CORE_PATH,
  DEFAULT_ESPACE_PATH,
} from './index.js';

// Standard BIP-39 test vector (NEVER use this in production).
const TEST_MNEMONIC = 'test test test test test test test test test test test junk';

// Hardcoded keys for low-level tests.
const TEST_ESPACE_KEY =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80' as `0x${string}`;
const TEST_CORE_KEY =
  '0x59c6995e998f97a5a004df98d9c7049a0c6bb8f1510a6dea3627a35db8f356b0' as `0x${string}`;

describe('generateMnemonic / validateMnemonic', () => {
  it('generates a valid 12-word mnemonic by default', () => {
    const m = generateMnemonic();
    expect(m.split(' ')).toHaveLength(12);
    expect(validateMnemonic(m)).toBe(true);
  });

  it('generates a valid 24-word mnemonic at strength 256', () => {
    const m = generateMnemonic(256);
    expect(m.split(' ')).toHaveLength(24);
    expect(validateMnemonic(m)).toBe(true);
  });

  it('rejects garbage', () => {
    expect(validateMnemonic('not a mnemonic')).toBe(false);
  });
});

describe('accountFromPrivateKey', () => {
  it("derives hex address for eSpace path (60')", () => {
    const account = accountFromPrivateKey(TEST_ESPACE_KEY, { path: DEFAULT_ESPACE_PATH });
    expect(account.address.toLowerCase()).toBe('0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266');
    expect(account.address).toMatch(/^0x[0-9a-fA-F]{40}$/);
  });

  it("derives base32 address for Core path (503') with coreNetworkId", () => {
    const account = accountFromPrivateKey(TEST_CORE_KEY, {
      path: DEFAULT_CORE_PATH,
      coreNetworkId: 1,
    });
    expect(account.address).toMatch(/^cfxtest:/);
  });

  it('throws if core path but no coreNetworkId', () => {
    expect(() => accountFromPrivateKey(TEST_CORE_KEY, { path: DEFAULT_CORE_PATH })).toThrow(
      WalletError,
    );
  });

  it('throws if family mismatch with path', () => {
    expect(() =>
      accountFromPrivateKey(TEST_ESPACE_KEY, { path: DEFAULT_CORE_PATH, family: 'espace' }),
    ).toThrow(WalletError);
  });

  it('uses family when no path given', () => {
    const account = accountFromPrivateKey(TEST_CORE_KEY, { family: 'core', coreNetworkId: 1 });
    expect(account.address).toMatch(/^cfxtest:/);
  });
});

describe('deriveAccount', () => {
  it('derives eSpace account at default path', () => {
    const result = deriveAccount({ mnemonic: TEST_MNEMONIC, path: DEFAULT_ESPACE_PATH });
    expect(result.account.address.toLowerCase()).toBe('0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266');
  });

  it('derives Core account at core path with coreNetworkId', () => {
    const result = deriveAccount({
      mnemonic: TEST_MNEMONIC,
      path: DEFAULT_CORE_PATH,
      coreNetworkId: 1,
    });
    expect(result.account.address).toMatch(/^cfxtest:/);
  });

  it('throws if core path but no coreNetworkId', () => {
    expect(() => deriveAccount({ mnemonic: TEST_MNEMONIC, path: DEFAULT_CORE_PATH })).toThrow(
      WalletError,
    );
  });

  it('same inputs produce same account', () => {
    const a = deriveAccount({ mnemonic: TEST_MNEMONIC, path: DEFAULT_ESPACE_PATH });
    const b = deriveAccount({ mnemonic: TEST_MNEMONIC, path: DEFAULT_ESPACE_PATH });
    expect(a.account.address).toBe(b.account.address);
  });

  it('different paths produce different addresses', () => {
    const a = deriveAccount({ mnemonic: TEST_MNEMONIC, path: "m/44'/60'/0'/0/0" });
    const b = deriveAccount({ mnemonic: TEST_MNEMONIC, path: "m/44'/60'/0'/0/1" });
    expect(a.account.address).not.toBe(b.account.address);
  });

  it('has signMessage method (viem account)', async () => {
    const result = deriveAccount({ mnemonic: TEST_MNEMONIC, path: DEFAULT_ESPACE_PATH });
    const sig = await result.account.signMessage({ message: 'hello' });
    expect(sig).toMatch(/^0x[0-9a-f]+$/);
  });

  it('rejects invalid mnemonic', () => {
    expect(() => deriveAccount({ mnemonic: 'not a valid mnemonic phrase' })).toThrow(WalletError);
  });
});

describe('deriveAccounts', () => {
  it('returns multiple accounts', () => {
    const results = deriveAccounts({
      mnemonic: TEST_MNEMONIC,
      basePath: "m/44'/60'/0'/0",
      count: 3,
    });
    expect(results).toHaveLength(3);
    const addresses = results.map((r) => r.account.address);
    const unique = new Set(addresses);
    expect(unique.size).toBe(3);
  });

  it('first account matches deriveAccount', () => {
    const results = deriveAccounts({
      mnemonic: TEST_MNEMONIC,
      basePath: "m/44'/60'/0'/0",
      count: 2,
    });
    const single = deriveAccount({
      mnemonic: TEST_MNEMONIC,
      path: "m/44'/60'/0'/0/0",
    });
    expect(results[0].account.address).toBe(single.account.address);
  });

  it('rejects non-positive count', () => {
    expect(() => deriveAccounts({ mnemonic: TEST_MNEMONIC, count: 0 })).toThrow(WalletError);
  });
});

describe('signerFromPrivateKey', () => {
  it('creates eSpace signer by default', () => {
    const signer = signerFromPrivateKey(TEST_ESPACE_KEY);
    expect(signer.account.address.toLowerCase()).toBe('0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266');
  });

  it('creates Core signer with family: core', () => {
    const signer = signerFromPrivateKey(TEST_CORE_KEY, { family: 'core', coreNetworkId: 1 });
    expect(signer.account.address).toMatch(/^cfxtest:/);
  });

  it('throws if core family but no coreNetworkId', () => {
    expect(() => signerFromPrivateKey(TEST_CORE_KEY, { family: 'core' })).toThrow(WalletError);
  });

  it('signs message', async () => {
    const signer = signerFromPrivateKey(TEST_ESPACE_KEY);
    const sig = await signer.signMessage('hello');
    expect(sig).toMatch(/^0x[0-9a-f]{130}$/);
  });

  it('signs eSpace transaction', async () => {
    const signer = signerFromPrivateKey(TEST_ESPACE_KEY);
    const sig = await signer.signTransaction({
      family: 'espace',
      chainId: 71,
      to: '0x0000000000000000000000000000000000000000',
      value: 1n,
      nonce: 0,
      gas: 21_000n,
      maxFeePerGas: 1_000_000_000n,
      maxPriorityFeePerGas: 1_000_000_000n,
    });
    expect(sig).toMatch(/^0x02/);
  });

  it('signs Core transaction', async () => {
    const signer = signerFromPrivateKey(TEST_CORE_KEY, { family: 'core', coreNetworkId: 1 });
    const coreAddress = signer.account.address;
    const sig = await signer.signTransaction({
      family: 'core',
      chainId: 1,
      nonce: 0,
      gas: 21_000n,
      storageLimit: 0n,
      epochHeight: 0n,
      to: coreAddress,
      value: 0n,
      coreType: 'legacy',
      gasPrice: 1_000_000_000n,
    });
    expect(sig).toMatch(/^0x[0-9a-f]+$/i);
  });

  it('rejects malformed private key', () => {
    expect(() => signerFromPrivateKey('0xnope' as `0x${string}`)).toThrow(WalletError);
  });
});

describe('signerFromMnemonic', () => {
  it('derives eSpace signer at default path', () => {
    const signer = signerFromMnemonic({ mnemonic: TEST_MNEMONIC });
    expect(signer.account.address.toLowerCase()).toBe('0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266');
  });

  it('derives Core signer with coreNetworkId', () => {
    const signer = signerFromMnemonic({
      mnemonic: TEST_MNEMONIC,
      path: DEFAULT_CORE_PATH,
      coreNetworkId: 1,
    });
    expect(signer.account.address).toMatch(/^cfxtest:/);
  });

  it('throws if core path but no coreNetworkId', () => {
    expect(() => signerFromMnemonic({ mnemonic: TEST_MNEMONIC, path: DEFAULT_CORE_PATH })).toThrow(
      WalletError,
    );
  });

  it('signs message', async () => {
    const signer = signerFromMnemonic({ mnemonic: TEST_MNEMONIC });
    const sig = await signer.signMessage('hello');
    expect(sig).toMatch(/^0x[0-9a-f]{130}$/);
  });

  it('signs transaction', async () => {
    const signer = signerFromMnemonic({ mnemonic: TEST_MNEMONIC });
    const sig = await signer.signTransaction({
      family: 'espace',
      chainId: 71,
      to: '0x0000000000000000000000000000000000000000',
      value: 1n,
      nonce: 0,
      gas: 21_000n,
      maxFeePerGas: 1_000_000_000n,
      maxPriorityFeePerGas: 1_000_000_000n,
    });
    expect(sig).toMatch(/^0x02/);
  });

  it('produces deterministic accounts', () => {
    const s1 = signerFromMnemonic({ mnemonic: TEST_MNEMONIC });
    const s2 = signerFromMnemonic({ mnemonic: TEST_MNEMONIC });
    expect(s1.account.address).toBe(s2.account.address);
  });
});

describe('deriveDualAccount', () => {
  it('derives both eSpace and Core addresses', () => {
    const dual = deriveDualAccount({
      mnemonic: TEST_MNEMONIC,
      index: 0,
      coreNetworkId: 1,
    });
    expect(dual.evm.address.toLowerCase()).toMatch(/^0x[0-9a-f]{40}$/);
    expect(dual.core.address).toMatch(/^cfxtest:/);
    expect(dual.index).toBe(0);
  });

  it('eSpace and Core come from different HD paths', () => {
    const dual = deriveDualAccount({
      mnemonic: TEST_MNEMONIC,
      index: 0,
      coreNetworkId: 1,
    });
    expect(dual.paths.evm).toBe("m/44'/60'/0'/0/0");
    expect(dual.paths.core).toBe("m/44'/503'/0'/0/0");
    expect(dual.evm.address).not.toBe(dual.core.address);
  });

  it("mining accountType uses 1' segment", () => {
    const dual = deriveDualAccount({
      mnemonic: TEST_MNEMONIC,
      index: 0,
      accountType: 'mining',
      coreNetworkId: 1,
    });
    expect(dual.paths.evm).toBe("m/44'/60'/1'/0/0");
    expect(dual.paths.core).toBe("m/44'/503'/1'/0/0");
  });

  it('throws if no coreNetworkId', () => {
    expect(() => deriveDualAccount({ mnemonic: TEST_MNEMONIC })).toThrow(WalletError);
  });

  it('throws if negative index', () => {
    expect(() =>
      deriveDualAccount({ mnemonic: TEST_MNEMONIC, index: -1, coreNetworkId: 1 }),
    ).toThrow(WalletError);
  });

  it('accounts have signing methods', async () => {
    const dual = deriveDualAccount({
      mnemonic: TEST_MNEMONIC,
      index: 0,
      coreNetworkId: 1,
    });
    const eSig = await dual.evm.signMessage({ message: 'hello' });
    expect(eSig).toMatch(/^0x[0-9a-f]+$/);
  });
});

describe('deriveDualAccounts', () => {
  it('returns multiple dual accounts', () => {
    const duals = deriveDualAccounts({
      mnemonic: TEST_MNEMONIC,
      count: 3,
      startIndex: 5,
      coreNetworkId: 1,
    });
    expect(duals).toHaveLength(3);
    expect(duals.map((d) => d.index)).toEqual([5, 6, 7]);
  });

  it('rejects non-positive count', () => {
    expect(() =>
      deriveDualAccounts({ mnemonic: TEST_MNEMONIC, count: 0, coreNetworkId: 1 }),
    ).toThrow(WalletError);
  });
});

describe('signerFromDualMnemonic', () => {
  const signer = signerFromDualMnemonic({
    mnemonic: TEST_MNEMONIC,
    coreNetworkId: 1,
  });

  it('exposes eSpace address', () => {
    expect(signer.account.address.toLowerCase()).toMatch(/^0x[0-9a-f]{40}$/);
  });

  it('signs eSpace transaction', async () => {
    const sig = await signer.signTransaction({
      family: 'espace',
      chainId: 71,
      to: '0x0000000000000000000000000000000000000000',
      value: 1n,
      nonce: 0,
      gas: 21_000n,
      maxFeePerGas: 1_000_000_000n,
      maxPriorityFeePerGas: 1_000_000_000n,
    });
    expect(sig).toMatch(/^0x02/);
  });

  it('signs Core transaction', async () => {
    const dual = deriveDualAccount({
      mnemonic: TEST_MNEMONIC,
      index: 0,
      coreNetworkId: 1,
    });
    const sig = await signer.signTransaction({
      family: 'core',
      chainId: 1,
      nonce: 0,
      gas: 21_000n,
      storageLimit: 0n,
      epochHeight: 0n,
      to: dual.core.address,
      value: 0n,
      coreType: 'legacy',
      gasPrice: 1_000_000_000n,
    });
    expect(sig).toMatch(/^0x[0-9a-f]+$/i);
  });

  it('signs message with eSpace key', async () => {
    const sig = await signer.signMessage('hello dual');
    expect(sig).toMatch(/^0x[0-9a-f]{130}$/);
  });

  it('uses specified index', () => {
    const s0 = signerFromDualMnemonic({ mnemonic: TEST_MNEMONIC, index: 0, coreNetworkId: 1 });
    const s1 = signerFromDualMnemonic({ mnemonic: TEST_MNEMONIC, index: 1, coreNetworkId: 1 });
    expect(s0.account.address).not.toBe(s1.account.address);
  });

  it('throws if no coreNetworkId', () => {
    expect(() => signerFromDualMnemonic({ mnemonic: TEST_MNEMONIC })).toThrow(WalletError);
  });
});
