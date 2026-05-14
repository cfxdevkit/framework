import { createSiweMessage } from '@cfxdevkit/wallet-connect/siwe';
import request from 'supertest';
import { privateKeyToAccount } from 'viem/accounts';
import { createCasBackendApp, createCasBackendState } from './app.js';
import type { CasBackendConfig } from './config.js';

export const TEST_ACCOUNT = privateKeyToAccount(
  '0x59c6995e998f97a5a0044966f094538c5fbd3f0d9cb7d0b3a7e3c5f5d8f7aa11',
);
export const OTHER_ACCOUNT = privateKeyToAccount(
  '0x8b3a350cf5c34c9194ca3a545d5e8d6354ee4351d9f5e4b4f2a2b936d7d1b9aa',
);

export function makeConfig(): CasBackendConfig {
  return {
    port: 0,
    host: '127.0.0.1',
    sqlitePath: ':memory:',
    authSecret: 'test-secret',
    corsOrigins: [],
    network: 'testnet',
    rpcUrl: 'http://127.0.0.1:9',
    automationManagerAddress: '0x0000000000000000000000000000000000000000',
    priceAdapterAddress: '0x0000000000000000000000000000000000000000',
    permitHandlerAddress: '0x0000000000000000000000000000000000000000',
    adminAddresses: [TEST_ACCOUNT.address.toLowerCase()],
    poolsCacheTtlMs: 30 * 60 * 1000,
    sessionTtlMs: 24 * 60 * 60 * 1000,
    nonceTtlMs: 5 * 60 * 1000,
    keeperEnabled: false,
    keeperIntervalMs: 15_000,
    keeperConcurrency: 1,
    priceSource: 'swappi',
    maxGasPriceGwei: 500,
  };
}

export async function signIn(
  app: ReturnType<typeof createCasBackendApp>['app'],
  account = TEST_ACCOUNT,
): Promise<string> {
  const nonceRes = await request(app).get(`/auth/nonce?address=${account.address}`);
  const message = createSiweMessage({
    domain: 'localhost:3000',
    address: account.address,
    statement: 'Sign in to CAS local dev.',
    uri: 'http://localhost:3000',
    chainId: 71,
    nonce: nonceRes.body.nonce,
    issuedAt: new Date('2026-05-08T00:00:00.000Z').toISOString(),
  });
  const signature = await account.signMessage({ message });
  const verifyRes = await request(app).post('/auth/verify').send({ message, signature });
  return verifyRes.body.token as string;
}

export { createCasBackendApp, createCasBackendState };
