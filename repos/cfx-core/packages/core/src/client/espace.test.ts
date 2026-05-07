import { beforeEach, describe, expect, it, vi } from 'vitest';
import { espaceLocal, espaceTestnet } from '../chains/index.js';
import { RpcError } from '../errors/index.js';
import { createEspaceClient } from './espace.js';
import { http } from './transport.js';

const { mockPublicClient } = vi.hoisted(() => ({
  mockPublicClient: {
    request: vi.fn(),
    getBlockNumber: vi.fn(),
    getBlock: vi.fn(),
    getBalance: vi.fn(),
    getTransaction: vi.fn(),
    getTransactionReceipt: vi.fn(),
    getTransactionCount: vi.fn(),
    getGasPrice: vi.fn(),
    estimateGas: vi.fn(),
  },
}));

vi.mock('viem', async (importOriginal) => {
  const mod = await importOriginal<typeof import('viem')>();
  return { ...mod, createPublicClient: () => mockPublicClient };
});

const HASH = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' as `0x${string}`;

describe('createEspaceClient', () => {
  const client = createEspaceClient(espaceTestnet, http());

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('family is espace', () => {
    expect(client.family).toBe('espace');
  });

  it('chain is the provided chain', () => {
    expect(client.chain).toBe(espaceTestnet);
  });

  it('getBlockNumber returns the bigint from the underlying client', async () => {
    mockPublicClient.getBlockNumber.mockResolvedValue(42n);
    expect(await client.getBlockNumber()).toBe(42n);
  });

  it('getBlockNumber wraps errors in RpcError', async () => {
    mockPublicClient.getBlockNumber.mockRejectedValue(new Error('timeout'));
    await expect(client.getBlockNumber()).rejects.toBeInstanceOf(RpcError);
  });

  it('getBlock with string tag (latest)', async () => {
    const block = { number: 1n };
    mockPublicClient.getBlock.mockResolvedValue(block);
    const result = await client.getBlock('latest');
    expect(result).toBe(block);
    expect(mockPublicClient.getBlock).toHaveBeenCalledWith({ blockTag: 'latest' });
  });

  it('getBlock with bigint tag uses blockNumber', async () => {
    mockPublicClient.getBlock.mockResolvedValue({ number: 10n });
    await client.getBlock(10n);
    expect(mockPublicClient.getBlock).toHaveBeenCalledWith({ blockNumber: 10n });
  });

  it('getBlock with hash-like string uses blockHash', async () => {
    mockPublicClient.getBlock.mockResolvedValue({ number: 5n });
    await client.getBlock(HASH);
    expect(mockPublicClient.getBlock).toHaveBeenCalledWith({ blockHash: HASH });
  });

  it('getBlock wraps errors in RpcError', async () => {
    mockPublicClient.getBlock.mockRejectedValue(new Error('not found'));
    await expect(client.getBlock('latest')).rejects.toBeInstanceOf(RpcError);
  });

  it('getBalance without opts', async () => {
    mockPublicClient.getBalance.mockResolvedValue(100n);
    expect(await client.getBalance('0x0000000000000000000000000000000000000001')).toBe(100n);
    expect(mockPublicClient.getBalance).toHaveBeenCalledWith(
      expect.objectContaining({ address: '0x0000000000000000000000000000000000000001' }),
    );
  });

  it('getBalance with string blockTag', async () => {
    mockPublicClient.getBalance.mockResolvedValue(200n);
    await client.getBalance('0x0000000000000000000000000000000000000001', {
      blockTag: 'finalized',
    });
    expect(mockPublicClient.getBalance).toHaveBeenCalledWith(
      expect.objectContaining({ blockTag: 'finalized' }),
    );
  });

  it('getBalance with bigint blockTag uses blockNumber', async () => {
    mockPublicClient.getBalance.mockResolvedValue(300n);
    await client.getBalance('0x0000000000000000000000000000000000000001', {
      blockTag: 5n,
    });
    expect(mockPublicClient.getBalance).toHaveBeenCalledWith(
      expect.objectContaining({ blockNumber: 5n }),
    );
  });

  it('getTransactionReceipt returns the receipt when found', async () => {
    const receipt = { transactionHash: HASH };
    mockPublicClient.getTransactionReceipt.mockResolvedValue(receipt);
    expect(await client.getTransactionReceipt(HASH)).toBe(receipt);
  });

  it('getTransactionReceipt returns null for TransactionReceiptNotFoundError', async () => {
    const err = Object.assign(new Error('not found'), {
      name: 'TransactionReceiptNotFoundError',
    });
    mockPublicClient.getTransactionReceipt.mockRejectedValue(err);
    expect(await client.getTransactionReceipt(HASH)).toBeNull();
  });

  it('getTransactionReceipt wraps other errors in RpcError', async () => {
    mockPublicClient.getTransactionReceipt.mockRejectedValue(new Error('network'));
    await expect(client.getTransactionReceipt(HASH)).rejects.toBeInstanceOf(RpcError);
  });

  it('estimateGas returns the bigint', async () => {
    mockPublicClient.estimateGas.mockResolvedValue(21_000n);
    const gas = await client.estimateGas({ to: '0x0000000000000000000000000000000000000001' });
    expect(gas).toBe(21_000n);
  });

  it('estimateGas wraps errors in RpcError', async () => {
    mockPublicClient.estimateGas.mockRejectedValue(new Error('execution reverted'));
    await expect(
      client.estimateGas({ to: '0x0000000000000000000000000000000000000001' }),
    ).rejects.toBeInstanceOf(RpcError);
  });

  it('request delegates to the underlying client', async () => {
    mockPublicClient.request.mockResolvedValue({ id: 1 });
    const result = await client.request({ method: 'eth_blockNumber' });
    expect(result).toEqual({ id: 1 });
  });

  it('request wraps errors in RpcError', async () => {
    mockPublicClient.request.mockRejectedValue(new Error('method not found'));
    await expect(client.request({ method: 'eth_unknown' })).rejects.toBeInstanceOf(RpcError);
  });

  it('getTransaction returns the transaction when found', async () => {
    const tx = { hash: HASH, nonce: 1 };
    mockPublicClient.getTransaction.mockResolvedValue(tx);
    expect(await client.getTransaction(HASH)).toBe(tx);
  });

  it('getTransaction returns null for TransactionNotFoundError', async () => {
    const err = Object.assign(new Error('not found'), { name: 'TransactionNotFoundError' });
    mockPublicClient.getTransaction.mockRejectedValue(err);
    expect(await client.getTransaction(HASH)).toBeNull();
  });

  it('getTransaction wraps other errors in RpcError', async () => {
    mockPublicClient.getTransaction.mockRejectedValue(new Error('network'));
    await expect(client.getTransaction(HASH)).rejects.toBeInstanceOf(RpcError);
  });

  it('getTransactionCount returns the nonce', async () => {
    mockPublicClient.getTransactionCount.mockResolvedValue(5);
    const count = await client.getTransactionCount('0x0000000000000000000000000000000000000001');
    expect(count).toBe(5);
  });

  it('getTransactionCount wraps errors in RpcError', async () => {
    mockPublicClient.getTransactionCount.mockRejectedValue(new Error('bad'));
    await expect(
      client.getTransactionCount('0x0000000000000000000000000000000000000001'),
    ).rejects.toBeInstanceOf(RpcError);
  });

  it('getGasPrice returns the current gas price', async () => {
    mockPublicClient.getGasPrice.mockResolvedValue(1_000_000_000n);
    expect(await client.getGasPrice()).toBe(1_000_000_000n);
  });

  it('getGasPrice wraps errors in RpcError', async () => {
    mockPublicClient.getGasPrice.mockRejectedValue(new Error('bad'));
    await expect(client.getGasPrice()).rejects.toBeInstanceOf(RpcError);
  });

  it('sendRawTransaction returns the tx hash', async () => {
    mockPublicClient.request.mockResolvedValue(HASH);
    const hash = await client.sendRawTransaction('0xdeadbeef' as `0x${string}`);
    expect(hash).toBe(HASH);
    expect(mockPublicClient.request).toHaveBeenCalledWith({
      method: 'eth_sendRawTransaction',
      params: ['0xdeadbeef'],
    });
  });

  it('sendRawTransaction wraps errors in RpcError', async () => {
    mockPublicClient.request.mockRejectedValue(new Error('nonce too low'));
    await expect(client.sendRawTransaction('0xdeadbeef' as `0x${string}`)).rejects.toBeInstanceOf(
      RpcError,
    );
  });
});

describe('createEspaceClient / toViemChain branch coverage', () => {
  it('builds a client from a chain with no ws rpc (espaceLocal)', () => {
    // espaceLocal has no ws — exercises the !chain.rpc.ws branch in toViemChain
    const client = createEspaceClient(espaceLocal, http());
    expect(client.family).toBe('espace');
    expect(client.chain).toBe(espaceLocal);
  });
});
