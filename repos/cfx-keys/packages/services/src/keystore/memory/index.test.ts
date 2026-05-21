import { KeystoreError } from '@cfxdevkit/cdk';
import { deriveAccount } from '@cfxdevkit/cdk/wallet';
import { describe, expect, it } from 'vitest';
import { createMemoryKeystore } from './index.js';

const TEST_MNEMONIC = 'test test test test test test test test test test test junk';

function seededKeystore() {
  const { account, privateKey } = deriveAccount({
    mnemonic: TEST_MNEMONIC,
    path: "m/44'/60'/0'/0/0",
  });
  const ks = createMemoryKeystore({
    seed: [
      {
        ref: { service: 'cfxdevkit', account: 'deployer' },
        privateKey,
        meta: { label: 'test' },
      },
    ],
  });
  return { ks, account };
}

describe('createMemoryKeystore', () => {
  it('lists seeded secrets without leaking key material', async () => {
    const { ks } = seededKeystore();
    const items = await ks.list();
    expect(items).toHaveLength(1);
    expect(items[0]?.kind).toBe('private-key');
    expect(items[0]?.ref.account).toBe('deployer');
    expect(JSON.stringify(items[0])).not.toMatch(/0x[0-9a-f]{64}/i);
  });

  it('has() reflects presence', async () => {
    const { ks } = seededKeystore();
    expect(await ks.has({ service: 'cfxdevkit', account: 'deployer' })).toBe(true);
    expect(await ks.has({ service: 'cfxdevkit', account: 'missing' })).toBe(false);
  });

  it('getSigner() returns a Signer bound to the seeded account', async () => {
    const { ks, account } = seededKeystore();
    const signer = await ks.getSigner({ service: 'cfxdevkit', account: 'deployer' });
    expect(signer.account.address).toBe(account.address);
    const sig = await signer.signMessage('hello');
    expect(sig).toMatch(/^0x[0-9a-f]{130}$/);
  });

  it('getSigner() throws KeystoreError(not-found) for unknown ref', async () => {
    const { ks } = seededKeystore();
    let err: unknown;
    try {
      await ks.getSigner({ service: 'cfxdevkit', account: 'missing' });
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(KeystoreError);
    expect((err as KeystoreError).code).toBe('services/keystore/not-found');
  });

  it('put() stores a new secret; remove() deletes it', async () => {
    const { ks } = seededKeystore();
    const ref = { service: 'cfxdevkit', account: 'second' };
    const pk = `0x${'ab'.repeat(32)}`;
    await ks.put?.({ ref, kind: 'private-key', secret: pk as `0x${string}` });
    expect(await ks.has(ref)).toBe(true);
    await ks.remove?.(ref);
    expect(await ks.has(ref)).toBe(false);
  });

  it('capability blocks transactions to disallowed contracts', async () => {
    const { ks } = seededKeystore();
    const signer = await ks.getSigner(
      { service: 'cfxdevkit', account: 'deployer' },
      { contracts: ['0x000000000000000000000000000000000000dead'] },
    );
    let err: unknown;
    try {
      await signer.signTransaction({
        chainId: 71,
        to: '0x0000000000000000000000000000000000000001',
        value: 1n,
        nonce: 0,
        gas: 21_000n,
        maxFeePerGas: 1_000_000_000n,
        maxPriorityFeePerGas: 1_000_000_000n,
      });
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(KeystoreError);
  });

  it('capability allows transactions matching the policy', async () => {
    const { ks } = seededKeystore();
    const allowed = '0x000000000000000000000000000000000000dEaD' as const;
    const signer = await ks.getSigner(
      { service: 'cfxdevkit', account: 'deployer' },
      { chains: [71], contracts: [allowed], maxValuePerTx: 10n },
    );
    const sig = await signer.signTransaction({
      chainId: 71,
      to: allowed,
      value: 5n,
      nonce: 0,
      gas: 21_000n,
      maxFeePerGas: 1_000_000_000n,
      maxPriorityFeePerGas: 1_000_000_000n,
    });
    expect(sig.startsWith('0x02')).toBe(true);
  });

  it('audit logger records each action', async () => {
    const records: string[] = [];
    const { account, privateKey } = deriveAccount({
      mnemonic: TEST_MNEMONIC,
      path: "m/44'/60'/0'/0/0",
    });
    const ks = createMemoryKeystore({
      seed: [{ ref: { service: 's', account: 'a' }, privateKey }],
      audit: { record: (e) => records.push(`${e.action}:${e.ok}`) },
    });
    await ks.list();
    await ks.getSigner({ service: 's', account: 'a' });
    expect(records).toContain('list:true');
    expect(records).toContain('getSigner:true');
    // sanity: account was used
    expect(account.address).toMatch(/^0x[0-9a-fA-F]{40}$/);
  });
});
