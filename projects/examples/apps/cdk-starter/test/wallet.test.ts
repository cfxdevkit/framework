import { describe, expect, it } from 'vitest';
import {
  signerFromPrivateKey,
  signerFromMnemonic,
  generateMnemonic,
  validateMnemonic,
  signerFromDualMnemonic,
  deriveAccount,
  deriveDualAccount,
} from '@cfxdevkit/cdk/wallet';

describe('wallet', () => {
  const TEST_PK = '0x4c0883a69102937d6231471b5dbb6208fe73e4e3e5b557c5c72d7b7282945d00';

  it('signerFromPrivateKey returns a signer with hex address', () => {
    const signer = signerFromPrivateKey(TEST_PK);
    expect(signer.account.address).toBeDefined();
    expect(signer.account.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(signer.account.publicKey).toMatch(/^0x[a-fA-F0-9]+$/);
  });

  it('signerFromPrivateKey with family: core returns base32 address', () => {
    const signer = signerFromPrivateKey(TEST_PK, { family: 'core', coreNetworkId: 1 });
    expect(signer.account.address).toBeDefined();
    expect(signer.account.address).toMatch(/^cfxtest:/);
  });

  it('signerFromPrivateKey rejects invalid key', () => {
    expect(() => signerFromPrivateKey('0xinvalid' as never)).toThrow();
    expect(() => signerFromPrivateKey(('0x' + 'ab'.repeat(31)) as never)).toThrow();
  });

  it('signMessage returns a valid signature', async () => {
    const signer = signerFromPrivateKey(TEST_PK);
    const sig = await signer.signMessage('hello');
    expect(sig).toMatch(/^0x[a-fA-F0-9]+$/);
    expect(sig.length).toBeGreaterThan(130);
  });

  it('signerFromMnemonic creates signer from mnemonic', () => {
    const mnemonic = generateMnemonic();
    const signer = signerFromMnemonic({ mnemonic });
    expect(signer.account.address).toBeDefined();
    expect(signer.account.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
  });

  it('signerFromMnemonic with core path and coreNetworkId returns base32', () => {
    const mnemonic = generateMnemonic();
    const signer = signerFromMnemonic({
      mnemonic,
      path: "m/44'/503'/0'/0/0",
      coreNetworkId: 1,
    });
    expect(signer.account.address).toMatch(/^cfxtest:/);
  });

  it('generateMnemonic creates a valid BIP39 phrase', () => {
    const mnemonic = generateMnemonic();
    expect(mnemonic.trim().split(/\s+/)).toHaveLength(12);
    expect(validateMnemonic(mnemonic)).toBe(true);
  });

  it('validateMnemonic returns false for invalid phrase', () => {
    expect(validateMnemonic('not a valid mnemonic phrase test')).toBe(false);
  });

  it('deriveAccount returns signing-capable account', () => {
    const mnemonic = generateMnemonic();
    const result = deriveAccount({ mnemonic, path: "m/44'/60'/0'/0/0" });
    expect(result.account.address).toMatch(/^0x/);
  });

  it('deriveDualAccount returns both evm and core accounts', () => {
    const mnemonic = generateMnemonic();
    const dual = deriveDualAccount({ mnemonic, index: 0, coreNetworkId: 1 });
    expect(dual.evm.address).toMatch(/^0x/);
    expect(dual.core.address).toMatch(/^cfxtest:/);
  });

  it('signerFromDualMnemonic creates cross-space signer', () => {
    const mnemonic = generateMnemonic();
    const signer = signerFromDualMnemonic({ mnemonic, coreNetworkId: 1 });
    expect(signer.account.address).toMatch(/^0x/);
  });
});
