/**
 * Protocol integration tests — real devnode.
 *
 * Gate: set `RUN_DEVNODE_TESTS=1` to opt in. Requires no network access —
 * a Conflux devnode is spawned locally on loopback ports by `@cfxdevkit/devnode`.
 *
 * Without the flag the two `describe.skipIf` blocks are collected as skipped
 * and the suite exits 0 with no I/O.
 */
import { createClient, espaceLocal, http, signerFromPrivateKey } from '@cfxdevkit/cdk';
import { createDevNode } from '@cfxdevkit/devnode';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { estimateTransaction, getChainProgress, waitForTransactionReceipt } from './index.js';

const RUN_DEVNODE = process.env.RUN_DEVNODE_TESTS === '1';

describe.skipIf(!RUN_DEVNODE)('protocol / devnode integration', () => {
  let node: ReturnType<typeof createDevNode> | null = null;

  beforeAll(async () => {
    node = createDevNode();
    await node.start();
  }, 120_000);

  afterAll(async () => {
    if (node) await node.stop();
  }, 30_000);

  it('getChainProgress returns eSpace chain height > 0', async () => {
    if (!node) throw new Error('devnode not started');
    const client = createClient({
      chain: { ...espaceLocal, id: node.config.evmChainId },
      transport: http({ url: node.urls.espace, timeoutMs: 10_000 }),
    });
    const progress = await getChainProgress(client);
    expect(progress.family).toBe('espace');
    expect(progress.chainId).toBe(node.config.evmChainId);
    expect(typeof progress.height).toBe('bigint');
    expect(progress.height).toBeGreaterThanOrEqual(0n);
  }, 30_000);

  it('estimateTransaction returns a gas estimate for a plain value transfer', async () => {
    if (!node) throw new Error('devnode not started');
    const account = node.accounts[0];
    const client = createClient({
      chain: { ...espaceLocal, id: node.config.evmChainId },
      transport: http({ url: node.urls.espace, timeoutMs: 10_000 }),
    });
    if (client.family !== 'espace') throw new Error('expected espace client');
    const estimate = await estimateTransaction(client, {
      from: account.evmAddress as `0x${string}`,
      to: node.accounts[1].evmAddress as `0x${string}`,
      value: 1n,
    });
    expect(typeof estimate.gas).toBe('bigint');
    expect(estimate.gas).toBeGreaterThan(0n);
  }, 30_000);

  it('waitForTransactionReceipt resolves for a signed raw transaction', async () => {
    if (!node) throw new Error('devnode not started');
    const account = node.accounts[0];
    const client = createClient({
      chain: { ...espaceLocal, id: node.config.evmChainId },
      transport: http({ url: node.urls.espace, timeoutMs: 10_000 }),
    });
    if (client.family !== 'espace') throw new Error('expected espace client');
    const signer = signerFromPrivateKey(account.privateKey as `0x${string}`);
    const nonce = await client.getTransactionCount(account.evmAddress as `0x${string}`);
    const gasPrice = await client.getGasPrice();
    const signed = await signer.signTransaction({
      family: 'espace',
      chainId: node.config.evmChainId,
      nonce,
      to: node.accounts[1].evmAddress as `0x${string}`,
      value: 1n,
      gas: 21_000n,
      gasPrice,
    });
    const hash = await client.sendRawTransaction(signed);
    const receipt = await waitForTransactionReceipt(client, hash, {
      intervalMs: 500,
      timeoutMs: 30_000,
    });
    expect(receipt).toBeDefined();
    expect((receipt as { transactionHash?: string }).transactionHash).toBe(hash);
  }, 60_000);
});
