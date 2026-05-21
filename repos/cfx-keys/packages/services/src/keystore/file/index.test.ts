import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { KeystoreError } from '@cfxdevkit/cdk';
import { deriveAccount } from '@cfxdevkit/cdk/wallet';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  changeFilePassphrase,
  createFileKeystore,
  initFileKeystore,
  readFileKeystoreMnemonic,
} from './index.js';

/** Lightweight Argon2id params for tests — real derivation takes ~5 s per call. */
const TEST_KDF = { memKiB: 64, iterations: 1 } as const;

const TEST_MNEMONIC = 'test test test test test test test test test test test junk';
const PASS = 'correct horse battery staple';

let dir: string;
let path: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'cfx-keystore-'));
  path = join(dir, 'keystore.json');
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe('createFileKeystore', () => {
  it('init → put → list → getSigner roundtrip', { timeout: 5_000 }, async () => {
    await initFileKeystore({ path, passphrase: PASS, kdf: TEST_KDF });
    const ks = createFileKeystore({ path, unlock: async () => ({ passphrase: PASS }) });

    const { account, privateKey } = deriveAccount({
      mnemonic: TEST_MNEMONIC,
      path: "m/44'/60'/0'/0/0",
    });
    const ref = { service: 'cfxdevkit', account: 'deployer' };
    await ks.put?.({ ref, kind: 'private-key', secret: privateKey });

    const items = await ks.list();
    expect(items).toHaveLength(1);
    expect(items[0]?.ref.account).toBe('deployer');
    expect(JSON.stringify(items[0])).not.toMatch(/0x[0-9a-f]{64}/i);

    const signer = await ks.getSigner(ref);
    expect(signer.account.address).toBe(account.address);
    const sig = await signer.signMessage('hi');
    expect(sig).toMatch(/^0x[0-9a-f]{130}$/);
  });

  it('rejects wrong passphrase with KeystoreError(bad-passphrase)', {
    timeout: 5_000,
  }, async () => {
    await initFileKeystore({ path, passphrase: PASS, kdf: TEST_KDF });
    const setupKs = createFileKeystore({ path, unlock: async () => ({ passphrase: PASS }) });
    const { privateKey } = deriveAccount({ mnemonic: TEST_MNEMONIC, path: "m/44'/60'/0'/0/0" });
    await setupKs.put?.({
      ref: { service: 's', account: 'a' },
      kind: 'private-key',
      secret: privateKey,
    });

    const wrongKs = createFileKeystore({ path, unlock: async () => ({ passphrase: 'WRONG' }) });
    let err: unknown;
    try {
      await wrongKs.getSigner({ service: 's', account: 'a' });
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(KeystoreError);
    expect((err as KeystoreError).code).toBe('services/keystore/bad-passphrase');
  });

  it('reads an unlocked mnemonic without exposing it through list', {
    timeout: 5_000,
  }, async () => {
    await initFileKeystore({ path, passphrase: PASS, kdf: TEST_KDF });
    const ks = createFileKeystore({ path, unlock: async () => ({ passphrase: PASS }) });
    const ref = { service: 'cfxdevkit', account: 'mnemonic-default' };
    await ks.put?.({ ref, kind: 'mnemonic', secret: TEST_MNEMONIC });

    const items = await ks.list();
    expect(JSON.stringify(items)).not.toContain(TEST_MNEMONIC);
    await expect(
      readFileKeystoreMnemonic({ path, passphrase: 'WRONG', ref }),
    ).rejects.toBeInstanceOf(KeystoreError);
    await expect(readFileKeystoreMnemonic({ path, passphrase: PASS, ref })).resolves.toBe(
      TEST_MNEMONIC,
    );
  });

  it('changeFilePassphrase re-encrypts under the new passphrase', { timeout: 10_000 }, async () => {
    await initFileKeystore({ path, passphrase: PASS, kdf: TEST_KDF });
    const ks = createFileKeystore({ path, unlock: async () => ({ passphrase: PASS }) });
    const { account, privateKey } = deriveAccount({
      mnemonic: TEST_MNEMONIC,
      path: "m/44'/60'/0'/0/0",
    });
    const ref = { service: 's', account: 'a' };
    await ks.put?.({ ref, kind: 'private-key', secret: privateKey });

    await changeFilePassphrase({ path, oldPassphrase: PASS, newPassphrase: 'NEW-PASS' });

    const oldKs = createFileKeystore({ path, unlock: async () => ({ passphrase: PASS }) });
    await expect(oldKs.getSigner(ref)).rejects.toBeInstanceOf(KeystoreError);

    const newKs = createFileKeystore({ path, unlock: async () => ({ passphrase: 'NEW-PASS' }) });
    const signer = await newKs.getSigner(ref);
    expect(signer.account.address).toBe(account.address);
  });

  it('init refuses to overwrite an existing file', { timeout: 5_000 }, async () => {
    await initFileKeystore({ path, passphrase: PASS, kdf: TEST_KDF });
    await expect(
      initFileKeystore({ path, passphrase: PASS, kdf: TEST_KDF }),
    ).rejects.toBeInstanceOf(KeystoreError);
  });

  it('getSigner on missing ref → not-found', { timeout: 5_000 }, async () => {
    await initFileKeystore({ path, passphrase: PASS, kdf: TEST_KDF });
    const ks = createFileKeystore({ path, unlock: async () => ({ passphrase: PASS }) });
    let err: unknown;
    try {
      await ks.getSigner({ service: 's', account: 'missing' });
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(KeystoreError);
    expect((err as KeystoreError).code).toBe('services/keystore/not-found');
  });
});
