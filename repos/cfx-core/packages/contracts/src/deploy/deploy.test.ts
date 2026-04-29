import { describe, expect, it } from 'vitest';
import { ERC20_ABI } from '../abis/index.js';
import { getRecordedCalls, makeMockClient, makeMockSigner } from '../test/mocks.js';
import { deployContract } from './index.js';

const BYTECODE: `0x${string}` = '0x60006000';

describe('deployContract', () => {
  it('encodes deploy data, signs, and broadcasts', async () => {
    const client = makeMockClient({
      gas: 100_000n,
      rpc: {
        eth_getTransactionCount: '0x0',
        eth_sendRawTransaction: '0xdeployhash',
      },
    });
    const signer = makeMockSigner();

    const result = await deployContract({
      client,
      signer,
      abi: ERC20_ABI,
      bytecode: BYTECODE,
    });

    expect(result.hash).toBe('0xdeployhash');
    const signed = signer.history[0];
    expect(signed?.to).toBeUndefined();
    expect(signed?.data?.startsWith('0x60006000')).toBe(true);

    const methods = getRecordedCalls(client).map((c) => c.method);
    expect(methods).toContain('eth_sendRawTransaction');
  });

  it('extracts contractAddress from receipt when waiting', async () => {
    const receipt = {
      status: 'success',
      blockNumber: 1n,
      contractAddress: '0x000000000000000000000000000000000000c0de',
    } as never;
    const client = makeMockClient({
      gas: 100_000n,
      receipt,
      rpc: {
        eth_getTransactionCount: '0x0',
        eth_sendRawTransaction: '0xhash',
      },
    });
    const signer = makeMockSigner();

    const result = await deployContract({
      client,
      signer,
      abi: ERC20_ABI,
      bytecode: BYTECODE,
      waitForReceipt: true,
      pollIntervalMs: 1,
    });
    expect(result.address).toBe('0x000000000000000000000000000000000000c0de');
  });

  it('refuses Core Space clients', async () => {
    const client = makeMockClient({ family: 'core' });
    const signer = makeMockSigner();
    await expect(
      deployContract({ client, signer, abi: ERC20_ABI, bytecode: BYTECODE }),
    ).rejects.toMatchObject({ code: 'contracts/unsupported-family' });
  });
});
