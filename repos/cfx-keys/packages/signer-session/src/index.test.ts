import { describe, expect, it } from 'vitest';
import { createSignerSession } from '../src/index.js';

const TEST_PRIVATE_KEY =
  '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef' as `0x${string}`;

describe('createSignerSession — memory backend', () => {
  it('returns eSpace and core signers', async () => {
    const session = await createSignerSession({ kind: 'memory', privateKey: TEST_PRIVATE_KEY });

    expect(session.kind).toBe('memory');
    expect(session.eSpace.account.address).toMatch(/^0x[0-9a-fA-F]{40}$/);
    expect(session.core?.account.coreAddress).toMatch(/^cfx:/);
    expect(session.label).toContain('memory:');
  });

  it('eSpace signer can sign a message', async () => {
    const session = await createSignerSession({ kind: 'memory', privateKey: TEST_PRIVATE_KEY });
    const sig = await session.eSpace.signMessage('Hello Conflux');
    expect(sig).toMatch(/^0x[0-9a-fA-F]{130}$/);
  });

  it('core signer can sign a message', async () => {
    const session = await createSignerSession({ kind: 'memory', privateKey: TEST_PRIVATE_KEY });
    const sig = await session.core!.signMessage('Hello Core');
    expect(sig).toMatch(/^0x[0-9a-fA-F]{130}$/);
  });

  it('dispose is a no-op', async () => {
    const session = await createSignerSession({ kind: 'memory', privateKey: TEST_PRIVATE_KEY });
    await expect(session.dispose()).resolves.toBeUndefined();
  });
});

describe('createSignerSession — file-keystore backend', () => {
  it('throws when CFX_KEYSTORE_PATH is missing', async () => {
    const orig = process.env.CFX_KEYSTORE_PATH;
    delete process.env.CFX_KEYSTORE_PATH;
    delete process.env.CFX_PASSPHRASE;
    await expect(createSignerSession({ kind: 'file-keystore' })).rejects.toThrow(
      'CFX_KEYSTORE_PATH',
    );
    if (orig) process.env.CFX_KEYSTORE_PATH = orig;
  });
});
