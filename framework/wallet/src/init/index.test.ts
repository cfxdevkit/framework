import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  defaultKeystorePath,
  initLocalWallet,
  openLocalWallet,
  rotateLocalPassphrase,
} from './index.js';

let dir: string;
let path: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'cfx-init-'));
  path = join(dir, 'keystore.json');
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe('initLocalWallet', () => {
  it('creates an encrypted keystore, returns mnemonic + signer', { timeout: 30_000 }, async () => {
    const w = await initLocalWallet({ passphrase: 'correct horse battery staple', path });
    expect(w.path).toBe(path);
    expect(w.address).toMatch(/^0x[0-9a-fA-F]{40}$/);
    expect(w.mnemonic.split(/\s+/).length).toBe(24);
    expect(w.ref).toEqual({ service: 'cfxdevkit', account: 'default' });
    // Signer can sign messages.
    const sig = await w.signer.signMessage('hello');
    expect(sig).toMatch(/^0x[0-9a-f]{130}$/);
  });

  it('rejects short passphrases', async () => {
    await expect(initLocalWallet({ passphrase: 'short', path })).rejects.toThrow();
  });

  it('openLocalWallet round-trips after init', { timeout: 30_000 }, async () => {
    const init = await initLocalWallet({ passphrase: 'correct horse battery staple', path });
    const opened = await openLocalWallet({
      passphrase: 'correct horse battery staple',
      path,
    });
    expect(opened.signer.account.address).toBe(init.signer.account.address);
  });

  it('rotateLocalPassphrase changes the unlock secret', { timeout: 60_000 }, async () => {
    await initLocalWallet({ passphrase: 'correct horse battery staple', path });
    await rotateLocalPassphrase({
      oldPassphrase: 'correct horse battery staple',
      newPassphrase: 'a-much-better-secret-9876',
      path,
    });
    await expect(
      openLocalWallet({ passphrase: 'correct horse battery staple', path }),
    ).rejects.toThrow();
    const opened = await openLocalWallet({
      passphrase: 'a-much-better-secret-9876',
      path,
    });
    expect(opened.signer.account.address).toMatch(/^0x[0-9a-fA-F]{40}$/);
  });

  it('defaultKeystorePath honours CFXDEVKIT_KEYSTORE env', () => {
    const before = process.env.CFXDEVKIT_KEYSTORE;
    process.env.CFXDEVKIT_KEYSTORE = '/tmp/custom/keystore.json';
    expect(defaultKeystorePath()).toBe('/tmp/custom/keystore.json');
    if (before === undefined) delete process.env.CFXDEVKIT_KEYSTORE;
    else process.env.CFXDEVKIT_KEYSTORE = before;
  });
});
