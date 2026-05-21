import { signerFromPrivateKey } from '@cfxdevkit/cdk/wallet';
import { describe, expect, it } from 'vitest';
import {
  createSiweMessage,
  generateSiweNonce,
  parseSiweMessage,
  verifySiweMessage,
} from './index.js';

const privateKey = '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
const signer = signerFromPrivateKey(privateKey);

describe('@cfxdevkit/wallet-connect/siwe', () => {
  it('creates and parses SIWE messages', () => {
    const message = createSiweMessage({
      domain: 'cas.cfxdevkit.org',
      address: signer.account.address,
      uri: 'https://cas.cfxdevkit.org',
      chainId: 2030,
      nonce: 'abc12345',
      issuedAt: '2026-05-08T00:00:00.000Z',
      statement: 'Sign in to Conflux DevKit.',
      resources: ['https://cas.cfxdevkit.org/orders'],
    });
    expect(message).toContain('cas.cfxdevkit.org wants you to sign in');
    expect(parseSiweMessage(message)).toMatchObject({
      domain: 'cas.cfxdevkit.org',
      address: signer.account.address,
      chainId: 2030,
      nonce: 'abc12345',
      statement: 'Sign in to Conflux DevKit.',
      resources: ['https://cas.cfxdevkit.org/orders'],
    });
  });

  it('verifies a matching signature and rejects nonce mismatches', async () => {
    const message = createSiweMessage({
      domain: 'localhost:3000',
      address: signer.account.address,
      uri: 'http://localhost:3000',
      chainId: 2030,
      nonce: 'nonce123',
      issuedAt: '2026-05-08T00:00:00.000Z',
    });
    const signature = await signer.signMessage(message);
    await expect(
      verifySiweMessage({
        message,
        signature,
        expectedDomain: 'localhost:3000',
        expectedNonce: 'nonce123',
        expectedChainId: 2030,
      }),
    ).resolves.toMatchObject({ ok: true, address: signer.account.address });
    await expect(
      verifySiweMessage({ message, signature, expectedNonce: 'wrong123' }),
    ).resolves.toMatchObject({
      ok: false,
      error: 'SIWE nonce does not match expected nonce',
    });
  });

  it('generates alphanumeric nonces', () => {
    const nonce = generateSiweNonce({ length: 24 });
    expect(nonce).toMatch(/^[A-Za-z0-9]{24}$/);
  });
});
