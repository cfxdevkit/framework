import type { Hex } from '@cfxdevkit/cdk';
import { signerFromPrivateKey } from '@cfxdevkit/cdk/wallet';
import type { Capability } from '@cfxdevkit/services/keystore';
import { describe, expect, it } from 'vitest';
import { SessionKeyError } from '../errors/index.js';
import { canonicalAttestationMessage, createSessionKey } from './index.js';

const PARENT_PK = '0x1111111111111111111111111111111111111111111111111111111111111111' as Hex;
const SESSION_PK = '0x2222222222222222222222222222222222222222222222222222222222222222' as Hex;

function makeParent() {
  return signerFromPrivateKey(PARENT_PK);
}

const validCap: Capability = {
  chains: [1030],
  maxValuePerTx: 1000n,
  notAfter: Date.now() + 60_000,
};

describe('createSessionKey', () => {
  it('mints a session signer with the requested capability', async () => {
    const parent = makeParent();
    const session = await createSessionKey({
      parent,
      capability: validCap,
      privateKey: SESSION_PK,
    });

    expect(session.parent).toBe(parent.account.address);
    expect(session.address).toBe(signerFromPrivateKey(SESSION_PK).account.address);
    expect(session.address).not.toBe(session.parent);
    expect(session.attestation.signature).toMatch(/^0x[0-9a-f]+$/);
    expect(session.attestation.digest).toMatch(/^0x[0-9a-f]{64}$/);
    expect(session.isRevoked).toBe(false);
  });

  it('rejects an empty capability', async () => {
    await expect(createSessionKey({ parent: makeParent(), capability: {} })).rejects.toMatchObject({
      code: 'wallet/session-key/empty-capability',
    });
  });

  it('rejects a notAfter already in the past', async () => {
    await expect(
      createSessionKey({
        parent: makeParent(),
        capability: { chains: [1], notAfter: Date.now() - 1 },
      }),
    ).rejects.toBeInstanceOf(SessionKeyError);
  });

  it('enforces capability via the returned signer', async () => {
    const session = await createSessionKey({
      parent: makeParent(),
      capability: { chains: [1030], maxValuePerTx: 0n },
      privateKey: SESSION_PK,
    });
    await expect(session.signer.signTransaction({ chainId: 1, value: 0n })).rejects.toMatchObject({
      code: 'wallet/policies/chain-denied',
    });
  });

  it('blocks all sign calls after revoke()', async () => {
    const session = await createSessionKey({
      parent: makeParent(),
      capability: validCap,
      privateKey: SESSION_PK,
    });
    session.revoke();
    expect(session.isRevoked).toBe(true);
    await expect(session.signer.signMessage('hi')).rejects.toMatchObject({
      code: 'wallet/session-key/revoked',
    });
  });

  it('produces a stable canonical attestation message', () => {
    const msg = canonicalAttestationMessage(
      '0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      '0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
      { chains: [1030], maxValuePerTx: 0n, notAfter: 1234 },
    );
    const parsed = JSON.parse(msg);
    expect(parsed.v).toBe(1);
    expect(parsed.type).toBe('cfxdevkit.session-key.v1');
    expect(parsed.parent).toBe('0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb');
    expect(parsed.session).toBe('0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
    expect(parsed.capability.chains).toEqual([1030]);
    expect(parsed.capability.maxValuePerTx).toBe('0');
    expect(parsed.capability.notAfter).toBe(1234);
  });

  it('attestation signature is a valid eth-message signature from the parent', async () => {
    const parent = makeParent();
    const session = await createSessionKey({
      parent,
      capability: validCap,
      privateKey: SESSION_PK,
    });
    const { recoverMessageAddress } = await import('viem');
    const recovered = await recoverMessageAddress({
      message: session.attestation.message,
      signature: session.attestation.signature,
    });
    expect(recovered.toLowerCase()).toBe(parent.account.address.toLowerCase());
  });
});
