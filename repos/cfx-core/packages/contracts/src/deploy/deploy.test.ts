import { describe, expect, it } from 'vitest';
import { ERC20_ABI } from '../abis/index.js';
import { getRecordedCalls, makeMockClient, makeMockSigner } from '../test/mocks.js';
import { deployContract } from './index.js';

const BYTECODE: `0x${string}` = '0x60006000';

describe('deployContract', () => {
  it('encodes deploy data, signs, and broadcasts (eSpace)', async () => {
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
    expect(signed?.family).toBe('espace');

    const methods = getRecordedCalls(client).map((c) => c.method);
    expect(methods).toContain('eth_sendRawTransaction');
  });

  it('extracts contractAddress from receipt when waiting (eSpace)', async () => {
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

  it('encodes deploy data, signs, and broadcasts (Core)', async () => {
    const client = makeMockClient({
      family: 'core',
      rpc: {
        cfx_getNextNonce: '0x5',
        cfx_estimateGasAndCollateral: { gasLimit: '0x186a0', storageCollateralized: '0x40' },
        cfx_gasPrice: '0x3b9aca00',
        cfx_epochNumber: '0x100',
        cfx_sendRawTransaction: '0xcorehash',
      },
    });
    const signer = makeMockSigner({ coreAddress: 'cfxtest:aaa…sender' });

    const result = await deployContract({
      client,
      signer,
      abi: ERC20_ABI,
      bytecode: BYTECODE,
    });

    expect(result.hash).toBe('0xcorehash');
    const signed = signer.history[0];
    expect(signed?.to).toBeUndefined();
    expect(signed?.family).toBe('core');
    expect(signed?.gas).toBe(100000n);
    expect(signed?.storageLimit).toBe(64n);
    expect(signed?.epochHeight).toBe(256n);
    expect(signed?.gasPrice).toBe(1000000000n);
    expect(signed?.coreType).toBe('cip2930');

    const methods = getRecordedCalls(client).map((c) => c.method);
    expect(methods).toEqual(
      expect.arrayContaining([
        'cfx_getNextNonce',
        'cfx_estimateGasAndCollateral',
        'cfx_gasPrice',
        'cfx_epochNumber',
        'cfx_sendRawTransaction',
      ]),
    );
  });

  it('extracts contractCreated from receipt when waiting (Core)', async () => {
    const receipt = {
      status: '0x0',
      blockNumber: 1n,
      contractCreated: 'cfxtest:acabcdef…created',
    } as never;
    const client = makeMockClient({
      family: 'core',
      rpc: {
        cfx_getNextNonce: '0x0',
        cfx_estimateGasAndCollateral: { gasLimit: '0x186a0', storageCollateralized: '0x40' },
        cfx_gasPrice: '0x1',
        cfx_epochNumber: '0x10',
        cfx_sendRawTransaction: '0xhash',
        cfx_getTransactionReceipt: receipt,
      },
    });
    const signer = makeMockSigner({ coreAddress: 'cfxtest:sender' });

    const result = await deployContract({
      client,
      signer,
      abi: ERC20_ABI,
      bytecode: BYTECODE,
      waitForReceipt: true,
      pollIntervalMs: 1,
    });
    expect(result.address).toBe('cfxtest:acabcdef…created');
  });

  it('throws contracts/invalid-argument for Core deploy without coreAddress', async () => {
    const client = makeMockClient({ family: 'core' });
    const signer = makeMockSigner(); // no coreAddress
    await expect(
      deployContract({ client, signer, abi: ERC20_ABI, bytecode: BYTECODE }),
    ).rejects.toMatchObject({ code: 'contracts/invalid-argument' });
  });
});
