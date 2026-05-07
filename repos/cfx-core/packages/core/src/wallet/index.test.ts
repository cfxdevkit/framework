import { describe, expect, it } from 'vitest';
import { WalletError } from '../errors/index.js';
import {
  coreAddressFromPrivateKey,
  DEFAULT_CORE_PATH,
  DEFAULT_ESPACE_PATH,
  deriveAccount,
  deriveAccounts,
  deriveDualAccount,
  deriveDualAccounts,
  generateMnemonic,
  signerFromPrivateKey,
  validateMnemonic,
} from './index.js';

// Standard BIP-39 test vector (NEVER use this in production).
const TEST_MNEMONIC = 'test test test test test test test test test test test junk';

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

describe('deriveAccount', () => {
  it('produces a deterministic account at the eSpace default path', () => {
    const a = deriveAccount({ mnemonic: TEST_MNEMONIC, path: DEFAULT_ESPACE_PATH });
    const b = deriveAccount({ mnemonic: TEST_MNEMONIC, path: DEFAULT_ESPACE_PATH });
    expect(a.account.address).toBe(b.account.address);
    // m/44'/60'/0'/0/0 of the well-known "test test … junk" mnemonic
    expect(a.account.address.toLowerCase()).toBe('0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266');
    expect(a.privateKey).toMatch(/^0x[0-9a-f]{64}$/);
    expect(a.account.publicKey).toMatch(/^0x04[0-9a-f]+$/);
  });

  it('different paths give different keys', () => {
    const espace = deriveAccount({ mnemonic: TEST_MNEMONIC, path: DEFAULT_ESPACE_PATH });
    const core = deriveAccount({ mnemonic: TEST_MNEMONIC, path: DEFAULT_CORE_PATH });
    expect(espace.privateKey).not.toBe(core.privateKey);
    expect(espace.account.address).not.toBe(core.account.address);
  });

  it('passphrase changes the derived key', () => {
    const a = deriveAccount({ mnemonic: TEST_MNEMONIC });
    const b = deriveAccount({ mnemonic: TEST_MNEMONIC, passphrase: 'extra' });
    expect(a.privateKey).not.toBe(b.privateKey);
  });

  it('rejects an invalid mnemonic with WalletError', () => {
    let err: unknown;
    try {
      deriveAccount({ mnemonic: 'definitely not a valid mnemonic phrase' });
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(WalletError);
    expect((err as WalletError).code).toBe('core/wallet/derivation');
  });
});

describe('deriveAccounts', () => {
  it('returns the requested count of distinct accounts', () => {
    const accs = deriveAccounts({
      mnemonic: TEST_MNEMONIC,
      basePath: "m/44'/60'/0'/0",
      count: 3,
    });
    expect(accs).toHaveLength(3);
    const addresses = new Set(accs.map((a) => a.account.address));
    expect(addresses.size).toBe(3);
    // First account matches deriveAccount at the same path
    expect(accs[0]?.account.address.toLowerCase()).toBe(
      '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
    );
  });

  it('rejects non-positive count', () => {
    expect(() => deriveAccounts({ mnemonic: TEST_MNEMONIC, count: 0 })).toThrow(WalletError);
  });
});

describe('signerFromPrivateKey', () => {
  const { privateKey, account } = deriveAccount({
    mnemonic: TEST_MNEMONIC,
    path: DEFAULT_ESPACE_PATH,
  });
  const signer = signerFromPrivateKey(privateKey);

  it('exposes the matching account', () => {
    expect(signer.account.address).toBe(account.address);
    expect(signer.account.publicKey).toBe(account.publicKey);
  });

  it('signMessage produces a 65-byte hex signature', async () => {
    const sig = await signer.signMessage('hello');
    expect(sig).toMatch(/^0x[0-9a-f]{130}$/);
  });

  it('signTransaction returns a serialized RLP hex string', async () => {
    const sig = await signer.signTransaction({
      chainId: 71,
      to: '0x0000000000000000000000000000000000000000',
      value: 1n,
      nonce: 0,
      gas: 21_000n,
      maxFeePerGas: 1_000_000_000n,
      maxPriorityFeePerGas: 1_000_000_000n,
    });
    expect(sig).toMatch(/^0x[0-9a-f]+$/);
    // EIP-1559 transactions are prefixed with 0x02
    expect(sig.startsWith('0x02')).toBe(true);
  });

  it('signTypedData signs an EIP-712 payload', async () => {
    const sig = await signer.signTypedData({
      domain: { name: 'Test', version: '1', chainId: 71 },
      types: {
        Mail: [
          { name: 'from', type: 'address' },
          { name: 'to', type: 'address' },
        ],
      },
      primaryType: 'Mail',
      message: {
        from: '0x0000000000000000000000000000000000000001',
        to: '0x0000000000000000000000000000000000000002',
      },
    });
    expect(sig).toMatch(/^0x[0-9a-f]{130}$/);
  });

  it('rejects malformed private key with WalletError', () => {
    expect(() => signerFromPrivateKey('0xnope' as `0x${string}`)).toThrow(WalletError);
  });
});

describe('signerFromPrivateKey / coreNetworkId', () => {
  const { privateKey } = deriveAccount({ mnemonic: TEST_MNEMONIC, path: DEFAULT_CORE_PATH });

  it('populates account.coreAddress when coreNetworkId is provided', () => {
    const signer = signerFromPrivateKey(privateKey, 1029);
    expect(signer.account.coreAddress).toBeDefined();
    expect(signer.account.coreAddress?.startsWith('cfx:')).toBe(true);
  });

  it('does not set coreAddress when coreNetworkId is omitted', () => {
    const signer = signerFromPrivateKey(privateKey);
    expect(signer.account.coreAddress).toBeUndefined();
  });

  it('signMessage accepts a Uint8Array (raw bytes path)', async () => {
    const signer = signerFromPrivateKey(privateKey);
    const bytes = new TextEncoder().encode('hello bytes');
    const sig = await signer.signMessage(bytes);
    expect(sig).toMatch(/^0x[0-9a-f]{130}$/);
  });

  it('signTransaction with family: core delegates to Core Space signer', async () => {
    const signer = signerFromPrivateKey(privateKey, 1);
    const coreAddress = signer.account.coreAddress!;
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

  it('signTransaction wraps Core signing failure in WalletError via signRejected', async () => {
    const signer = signerFromPrivateKey(privateKey);
    // Missing required Core Space fields → signCoreTransaction throws, caught and re-wrapped
    await expect(signer.signTransaction({ family: 'core', chainId: 1 })).rejects.toBeInstanceOf(
      WalletError,
    );
  });

  it('signTypedData wraps invalid typed data error in WalletError via signRejected', async () => {
    const signer = signerFromPrivateKey(privateKey);
    // primaryType 'Missing' is not in types → viem throws, caught and re-wrapped
    await expect(
      signer.signTypedData({
        domain: { name: 'Test', version: '1', chainId: 1 },
        types: { Mail: [{ name: 'from', type: 'address' }] },
        primaryType: 'Missing' as never,
        message: {},
      }),
    ).rejects.toBeInstanceOf(WalletError);
  });
});

describe('coreAddressFromPrivateKey', () => {
  const { privateKey } = deriveAccount({
    mnemonic: TEST_MNEMONIC,
    path: DEFAULT_CORE_PATH,
  });

  it('encodes mainnet as cfx:…', () => {
    const addr = coreAddressFromPrivateKey(privateKey, 1029);
    expect(addr.startsWith('cfx:')).toBe(true);
  });

  it('encodes testnet as cfxtest:…', () => {
    const addr = coreAddressFromPrivateKey(privateKey, 1);
    expect(addr.startsWith('cfxtest:')).toBe(true);
  });

  it('encodes local devnet (2029) as net2029:…', () => {
    const addr = coreAddressFromPrivateKey(privateKey, 2029);
    expect(addr.startsWith('net2029:')).toBe(true);
  });

  it('rejects malformed private key', () => {
    expect(() => coreAddressFromPrivateKey('0xnotahex' as `0x${string}`, 1029)).toThrow(
      WalletError,
    );
  });
});

describe('deriveDualAccount / deriveDualAccounts', () => {
  it('derives matching evm + core addresses for the same index', () => {
    const a = deriveDualAccount({
      mnemonic: TEST_MNEMONIC,
      index: 0,
      coreNetworkId: 2029,
    });
    expect(a.evmAddress).toMatch(/^0x[0-9a-fA-F]{40}$/);
    expect(a.coreAddress.startsWith('net2029:')).toBe(true);
    expect(a.paths.evm).toBe("m/44'/60'/0'/0/0");
    expect(a.paths.core).toBe("m/44'/503'/0'/0/0");
  });

  it("mining accountType uses 1' segment", () => {
    const a = deriveDualAccount({
      mnemonic: TEST_MNEMONIC,
      index: 0,
      accountType: 'mining',
    });
    expect(a.paths.evm).toBe("m/44'/60'/1'/0/0");
    expect(a.paths.core).toBe("m/44'/503'/1'/0/0");
  });

  it('deriveDualAccounts returns count entries with sequential indices', () => {
    const accs = deriveDualAccounts({
      mnemonic: TEST_MNEMONIC,
      count: 3,
      startIndex: 5,
      coreNetworkId: 1,
    });
    expect(accs).toHaveLength(3);
    expect(accs.map((a) => a.index)).toEqual([5, 6, 7]);
    for (const a of accs) {
      expect(a.coreAddress.startsWith('cfxtest:')).toBe(true);
    }
  });

  it('rejects negative index', () => {
    expect(() => deriveDualAccount({ mnemonic: TEST_MNEMONIC, index: -1 })).toThrow(WalletError);
  });

  it('rejects zero count', () => {
    expect(() => deriveDualAccounts({ mnemonic: TEST_MNEMONIC, count: 0 })).toThrow(WalletError);
  });
});
