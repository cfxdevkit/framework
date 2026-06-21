import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { addressToolingNamespace } from './address-namespace.js';
import { chainToolingNamespace } from './chain-namespace.js';
import { keystoreToolingNamespace } from './keystore-namespace.js';
import { unitsToolingNamespace } from './units-namespace.js';

const TEST_MNEMONIC = 'test test test test test test test test test test test junk';

describe('core tooling namespaces', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    process.exitCode = 0;
  });

  it('lists known chains', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await chainToolingNamespace.run(['list']);

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('espace-mainnet'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('core-mainnet'));
  });

  it('resolves aliases to chain configs', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await chainToolingNamespace.run(['resolve', 'conflux-espace-testnet']);

    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('conflux-espace-testnet -> espace-testnet'),
    );
  });

  it('validates hex addresses', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await addressToolingNamespace.run([
      'validate',
      '0x0123456789012345678901234567890123456789',
      '--json',
    ]);

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('"encoding": "hex"'));
  });

  it('formats gdrip values', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await unitsToolingNamespace.run(['format', '--unit', 'gdrip', '42000000000']);

    expect(logSpy).toHaveBeenCalledWith('42');
  });

  it('parses cfx values', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await unitsToolingNamespace.run(['parse', '--unit', 'cfx', '1']);

    expect(logSpy).toHaveBeenCalledWith('1000000000000000000');
  });

  it('creates and lists keystore signer entries', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'tooling-cli-keystore-'));
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await keystoreToolingNamespace.run([
      'set',
      'deployer',
      '--kind',
      'file-keystore',
      '--path',
      '.cfxdevkit/keystore.json',
      '--service',
      'cfxdevkit',
      '--account',
      'deployer',
      '--default',
      '--cwd',
      cwd,
    ]);

    await keystoreToolingNamespace.run(['list', '--cwd', cwd]);

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('saved signer deployer'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('* deployer'));
  });

  it('switches active signer using keystore use', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'tooling-cli-keystore-'));
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await keystoreToolingNamespace.run(['set', 'quick', '--kind', 'memory', '--cwd', cwd]);
    await keystoreToolingNamespace.run([
      'set',
      'deployer',
      '--kind',
      'file-keystore',
      '--path',
      '.cfxdevkit/keystore.json',
      '--cwd',
      cwd,
    ]);

    await keystoreToolingNamespace.run(['use', 'deployer', '--cwd', cwd]);

    const signerJson = await readFile(join(cwd, '.cfxdevkit', 'signer.json'), 'utf8');
    expect(JSON.parse(signerJson)).toMatchObject({ defaultSigner: 'deployer' });
    expect(logSpy).toHaveBeenCalledWith('default signer set to deployer');
  });

  it('prints keystore status as json', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'tooling-cli-keystore-'));
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await keystoreToolingNamespace.run([
      'set',
      'deployer',
      '--kind',
      'file-keystore',
      '--path',
      '.cfxdevkit/keystore.json',
      '--default',
      '--cwd',
      cwd,
    ]);

    await keystoreToolingNamespace.run(['status', '--cwd', cwd, '--json']);

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('"selectedSigner": "deployer"'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('"kind": "file-keystore"'));
  });

  it('validates signer reachability with ping', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'tooling-cli-keystore-'));
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await keystoreToolingNamespace.run([
      'set',
      'quick',
      '--kind',
      'memory',
      '--default',
      '--cwd',
      cwd,
    ]);
    await keystoreToolingNamespace.run(['ping', '--cwd', cwd, '--json']);

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('"reachable": true'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('"signature": "0x'));
  });

  it('casts message using configured signer', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'tooling-cli-keystore-'));
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await keystoreToolingNamespace.run([
      'set',
      'quick',
      '--kind',
      'memory',
      '--default',
      '--cwd',
      cwd,
    ]);
    await keystoreToolingNamespace.run(['cast', 'message', 'hello', '--cwd', cwd, '--json']);

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('"action": "message"'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('"signature": "0x'));
  });

  it('generates, validates, and derives mnemonic data', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await keystoreToolingNamespace.run(['mnemonic', 'generate', '--strength', '128', '--json']);
    await keystoreToolingNamespace.run([
      'mnemonic',
      'validate',
      '--mnemonic',
      TEST_MNEMONIC,
      '--json',
    ]);
    await keystoreToolingNamespace.run([
      'mnemonic',
      'derive',
      '--mnemonic',
      TEST_MNEMONIC,
      '--json',
    ]);

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('"mnemonic":'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('"valid": true'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('"evmAddress":'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('"coreAddress":'));
  });

  it('adds mnemonic to file keystore and links signer entry by account index', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'tooling-cli-keystore-'));
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const originalPassphrase = process.env.TEST_CFX_PASS;
    const originalMnemonic = process.env.TEST_CFX_MNEMONIC;
    const originalRuntimePassphrase = process.env.CFX_PASSPHRASE;
    process.env.TEST_CFX_PASS = 'pass-123';
    process.env.TEST_CFX_MNEMONIC = TEST_MNEMONIC;
    process.env.CFX_PASSPHRASE = 'pass-123';

    try {
      await keystoreToolingNamespace.run([
        'mnemonic',
        'add',
        '--name',
        'wallet-1',
        '--mnemonic-env',
        'TEST_CFX_MNEMONIC',
        '--passphrase-env',
        'TEST_CFX_PASS',
        '--account-index',
        '1',
        '--default',
        '--cwd',
        cwd,
        '--json',
      ]);

      await keystoreToolingNamespace.run(['ping', '--name', 'wallet-1', '--cwd', cwd, '--json']);

      const signerJson = await readFile(join(cwd, '.cfxdevkit', 'signer.json'), 'utf8');
      expect(JSON.parse(signerJson)).toMatchObject({
        defaultSigner: 'wallet-1',
        signers: {
          'wallet-1': {
            kind: 'file-keystore',
            accountIndex: 1,
          },
        },
      });
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('"signer": "wallet-1"'));
      expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('"reachable": true'));
    } finally {
      if (originalPassphrase === undefined) {
        delete process.env.TEST_CFX_PASS;
      } else {
        process.env.TEST_CFX_PASS = originalPassphrase;
      }
      if (originalMnemonic === undefined) {
        delete process.env.TEST_CFX_MNEMONIC;
      } else {
        process.env.TEST_CFX_MNEMONIC = originalMnemonic;
      }
      if (originalRuntimePassphrase === undefined) {
        delete process.env.CFX_PASSPHRASE;
      } else {
        process.env.CFX_PASSPHRASE = originalRuntimePassphrase;
      }
    }
  }, 15000);
});
